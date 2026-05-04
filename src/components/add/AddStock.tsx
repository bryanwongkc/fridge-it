import { useState } from "react";
import {
  createManualPersonalProduct,
  lookupByBarcode,
  type BarcodeLookupResult,
} from "../../services/productLookup";
import {
  createInventoryItem,
  findMergeCandidate,
  mergeInventoryQuantity,
} from "../../services/inventoryService";
import { updatePersonalProduct } from "../../services/productsService";
import type { InventoryInput, InventoryItem } from "../../types/inventory";
import type { HouseholdProduct, ProductInput } from "../../types/product";
import { friendlyErrorMessage } from "../../utils/friendlyErrors";
import { mergeCategories } from "../../utils/categories";
import { normalizeText } from "../../utils/normalize";
import { LoadingState } from "../common/LoadingState";
import { Button } from "../common/Button";
import { Notice } from "../common/Notice";
import { BarcodeScanner } from "./BarcodeScanner";
import { FastAddList } from "./FastAddList";
import { InputMethodPicker } from "./InputMethodPicker";
import { ManualProductSearch } from "./ManualProductSearch";
import { ProductCreateForm } from "./ProductCreateForm";
import { StockConfirmForm } from "./StockConfirmForm";

type AddStep =
  | "choose"
  | "scan"
  | "scan_for_create"
  | "manual"
  | "create"
  | "confirm"
  | "edit_product"
  | "success";

export function AddStock({
  householdId,
  userId,
  personalProducts,
  recentProducts,
  previousInventoryItems,
  onDone,
}: {
  householdId: string;
  userId: string | null;
  personalProducts: HouseholdProduct[];
  recentProducts: HouseholdProduct[];
  previousInventoryItems: InventoryItem[];
  onDone: () => void;
}) {
  const [step, setStep] = useState<AddStep>("choose");
  const [selectedProduct, setSelectedProduct] = useState<HouseholdProduct | null>(null);
  const [sourceLabel, setSourceLabel] = useState("Your library");
  const [initialCreateName, setInitialCreateName] = useState("");
  const [initialBarcode, setInitialBarcode] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<ProductInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "warning" | "danger">("success");
  const categoryOptions = mergeCategories([
    ...personalProducts.map((product) => product.category),
    ...recentProducts.map((product) => product.category),
    ...previousInventoryItems.map((item) => item.category),
  ]);

  const startManualCreate = (draft: ProductInput) => {
    setCreateDraft(draft);
    setInitialCreateName(draft.name);
    setInitialBarcode(draft.barcode || null);
    setStep("create");
  };

  const selectProduct = (product: HouseholdProduct, label: string) => {
    setMessageTone("success");
    setSelectedProduct(product);
    setSourceLabel(label);
    setStep("confirm");
  };

  const scanBarcode = async (barcode: string) => {
    setStep("choose");
    setMessageTone("success");
    setMessage("Looking up saved product...");
    try {
      const result: BarcodeLookupResult = await lookupByBarcode(householdId, barcode);
      if (result.source === "personal") {
        setMessage("Found in your library");
        selectProduct(result.product, "Your library");
        return;
      }

      setMessage("Product not found. Add it manually once and we will remember this barcode.");
      startManualCreate({
        name: "",
        barcode: result.barcode,
        defaultLocation: "fridge",
      });
    } catch (error) {
      console.error("Barcode lookup failed", error);
      setMessageTone("warning");
      setMessage(friendlyErrorMessage(error, "lookup"));
      startManualCreate({
        name: "",
        barcode,
        defaultLocation: "fridge",
      });
    }
  };

  const scanBarcodeForCreate = (draft: ProductInput) => {
    setCreateDraft(draft);
    setInitialCreateName(draft.name);
    setInitialBarcode(draft.barcode || null);
    setStep("scan_for_create");
  };

  const saveBarcodeForCreate = (barcode: string) => {
    const draft = createDraft || {
      name: initialCreateName,
      barcode: initialBarcode,
      defaultLocation: "fridge",
    };
    startManualCreate({
      ...draft,
      barcode,
      defaultLocation: draft.defaultLocation || "fridge",
    });
    setMessageTone("success");
    setMessage("Barcode saved with this manual product.");
  };

  const createManual = async (input: ProductInput, source: "manual" | "manual_after_scan") => {
    const product = await createManualPersonalProduct(householdId, input, userId, source);
    selectProduct(product, "Manual");
  };

  const selectPreviousItem = async (item: InventoryItem) => {
    const existingProduct =
      (item.productId && personalProducts.find((product) => product.id === item.productId)) ||
      (item.barcode && personalProducts.find((product) => product.barcode === item.barcode)) ||
      personalProducts.find(
        (product) =>
          product.normalizedName === normalizeText(item.name) &&
          (product.brand || null) === (item.brand || null),
      );

    if (existingProduct) {
      selectProduct(existingProduct, "Previous item");
      return;
    }

    try {
      const product = await createManualPersonalProduct(
        householdId,
        {
          name: item.name,
          barcode: item.barcode,
          brand: item.brand,
          category: item.category,
          imageUrl: item.imageUrl,
          defaultUnit: item.unit,
          defaultLocation: item.location,
          defaultShelfLifeDays: null,
        },
        userId,
        item.barcode ? "manual_after_scan" : "manual",
      );
      selectProduct(product, "Previous item");
    } catch (error) {
      console.error("Previous item reuse failed", error);
      setMessageTone("danger");
      setMessage(friendlyErrorMessage(error, "product"));
    }
  };

  const updateSelectedProduct = async (input: ProductInput) => {
    if (!selectedProduct) return;
    await updatePersonalProduct(householdId, selectedProduct.id, input);
    setSelectedProduct({
      ...selectedProduct,
      name: input.name.trim(),
      normalizedName: normalizeText(input.name),
      barcode: input.barcode || null,
      brand: input.brand || null,
      category: input.category || null,
      imageUrl: input.imageUrl || null,
      defaultUnit: input.defaultUnit || null,
      defaultLocation: input.defaultLocation || "fridge",
      defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
    });
    setStep("confirm");
  };

  const saveStock = async (
    product: HouseholdProduct,
    input: Pick<
      InventoryInput,
      "quantity" | "unit" | "location" | "expiryDate" | "hasNoExpiry" | "notes"
    >,
  ) => {
    const inventoryInput: InventoryInput = {
      productId: product.id,
      publicProductId: product.publicProductId,
      name: product.name,
      barcode: product.barcode,
      brand: product.brand,
      category: product.category,
      imageUrl: product.imageUrl,
      ...input,
    };
    const existing = await findMergeCandidate(householdId, inventoryInput);
    if (existing) {
      const merge = window.confirm("Merge with existing stock?");
      if (merge) {
        await mergeInventoryQuantity(householdId, existing.id, existing.quantity + input.quantity);
        setStep("success");
        return;
      }
    }
    await createInventoryItem(householdId, inventoryInput);
    setStep("success");
  };

  return (
    <section className="space-y-5 pb-4">
      {message ? <Notice tone={messageTone}>{message}</Notice> : null}

      {step === "choose" ? (
        <>
          {message === "Looking up saved product..." ? (
            <LoadingState label="Looking up saved product..." />
          ) : null}
          <InputMethodPicker
            onScan={() => setStep("scan")}
            onManual={() => setStep("manual")}
            onManualAdd={() =>
              startManualCreate({
                name: "",
                barcode: null,
                defaultLocation: "fridge",
              })
            }
          />
          <FastAddList
            products={recentProducts}
            inventoryItems={previousInventoryItems}
            onSelectProduct={selectProduct}
            onSelectInventoryItem={(item) => void selectPreviousItem(item)}
          />
        </>
      ) : null}

      {step === "scan" ? (
        <BarcodeScanner onDetected={scanBarcode} onCancel={() => setStep("choose")} />
      ) : null}

      {step === "scan_for_create" ? (
        <BarcodeScanner onDetected={saveBarcodeForCreate} onCancel={() => setStep("create")} />
      ) : null}

      {step === "manual" ? (
        <ManualProductSearch
          personalProducts={personalProducts}
          onSelect={selectProduct}
          onCreate={(name) =>
            startManualCreate({
              name,
              barcode: null,
              defaultLocation: "fridge",
            })
          }
        />
      ) : null}

      {step === "create" ? (
        <ProductCreateForm
          initialProduct={createDraft || undefined}
          initialName={initialCreateName}
          initialBarcode={initialBarcode}
          categoryOptions={categoryOptions}
          submitLabel="Create and add stock"
          onCancel={() => setStep("manual")}
          onScanBarcode={scanBarcodeForCreate}
          onSubmit={(input) => createManual(input, input.barcode ? "manual_after_scan" : "manual")}
        />
      ) : null}

      {step === "edit_product" && selectedProduct ? (
        <ProductCreateForm
          initialProduct={selectedProduct}
          categoryOptions={categoryOptions}
          submitLabel="Save changes"
          onCancel={() => setStep("confirm")}
          onSubmit={updateSelectedProduct}
        />
      ) : null}

      {step === "confirm" && selectedProduct ? (
        <StockConfirmForm
          product={selectedProduct}
          sourceLabel={sourceLabel}
          onSave={(input) => saveStock(selectedProduct, input)}
          onEditProduct={() => setStep("edit_product")}
          onExit={() => setStep("choose")}
        />
      ) : null}

      {step === "success" ? (
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-soft">
          <h1 className="text-2xl font-black text-kitchen-ink">Saved.</h1>
          <p className="mt-2 text-sm text-kitchen-muted">Add another item or check the dashboard.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setStep("choose")}>
              Add another
            </Button>
            <Button onClick={onDone}>Dashboard</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
