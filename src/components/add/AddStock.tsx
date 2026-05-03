import { useState } from "react";
import {
  createManualPersonalProduct,
  createPersonalProductFromOffDraft,
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
import { normalizeText } from "../../utils/normalize";
import { LoadingState } from "../common/LoadingState";
import { Button } from "../common/Button";
import { Notice } from "../common/Notice";
import { BarcodeScanner } from "./BarcodeScanner";
import { InputMethodPicker } from "./InputMethodPicker";
import { ManualProductSearch } from "./ManualProductSearch";
import { PreviousItems } from "./PreviousItems";
import { ProductCreateForm } from "./ProductCreateForm";
import { QuickAddRecent } from "./QuickAddRecent";
import { StockConfirmForm } from "./StockConfirmForm";

type AddStep =
  | "choose"
  | "scan"
  | "manual"
  | "create"
  | "confirm"
  | "off_review"
  | "edit_product"
  | "success";

export function AddStock({
  householdId,
  userId,
  personalProducts,
  publicProducts,
  recentProducts,
  previousInventoryItems,
  onDone,
}: {
  householdId: string;
  userId: string | null;
  personalProducts: HouseholdProduct[];
  publicProducts: Parameters<typeof ManualProductSearch>[0]["publicProducts"];
  recentProducts: HouseholdProduct[];
  previousInventoryItems: InventoryItem[];
  onDone: () => void;
}) {
  const [step, setStep] = useState<AddStep>("choose");
  const [selectedProduct, setSelectedProduct] = useState<HouseholdProduct | null>(null);
  const [sourceLabel, setSourceLabel] = useState("Your library");
  const [initialCreateName, setInitialCreateName] = useState("");
  const [initialBarcode, setInitialBarcode] = useState<string | null>(null);
  const [offDraft, setOffDraft] = useState<ProductInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "warning" | "danger">("success");

  const selectProduct = (product: HouseholdProduct, label: string) => {
    setMessageTone("success");
    setSelectedProduct(product);
    setSourceLabel(label);
    setStep("confirm");
  };

  const scanBarcode = async (barcode: string) => {
    setStep("choose");
    setMessageTone("success");
    setMessage("Looking up product...");
    try {
      const result: BarcodeLookupResult = await lookupByBarcode(householdId, barcode, userId);
      setMessage(
        result.source === "personal"
          ? "Found in your library"
          : result.source === "public"
            ? "Found in public library"
            : result.source === "open_food_facts"
              ? "Found online"
              : "Product not found. Add it once and we’ll remember it next time.",
      );
      if (result.source === "personal") selectProduct(result.product, "Your library");
      else if (result.source === "public") selectProduct(result.product, "Public library");
      else if (result.source === "open_food_facts") {
        setOffDraft(result.productDraft);
        setStep("off_review");
      } else {
        setInitialBarcode(result.barcode);
        setInitialCreateName("");
        setStep("create");
      }
    } catch (error) {
      console.error("Barcode lookup failed", error);
      setMessageTone("warning");
      setMessage(friendlyErrorMessage(error, "lookup"));
      setInitialBarcode(barcode);
      setStep("create");
    }
  };

  const createManual = async (input: ProductInput, source: "manual" | "manual_after_scan") => {
    const product = await createManualPersonalProduct(householdId, input, userId, source);
    selectProduct(product, "Manual");
  };

  const createFromOff = async (input: ProductInput) => {
    const product = await createPersonalProductFromOffDraft(householdId, input, userId);
    selectProduct(product, "Online lookup");
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
      {message ? (
        <Notice tone={messageTone}>{message}</Notice>
      ) : null}

      {step === "choose" ? (
        <>
          {message === "Looking up product..." ? <LoadingState label="Looking up product..." /> : null}
          <InputMethodPicker onScan={() => setStep("scan")} onManual={() => setStep("manual")} />
          <QuickAddRecent products={recentProducts} onSelect={selectProduct} />
          <PreviousItems items={previousInventoryItems} onSelect={(item) => void selectPreviousItem(item)} />
        </>
      ) : null}

      {step === "scan" ? <BarcodeScanner onDetected={scanBarcode} onCancel={() => setStep("choose")} /> : null}

      {step === "manual" ? (
        <ManualProductSearch
          householdId={householdId}
          userId={userId}
          personalProducts={personalProducts}
          publicProducts={publicProducts}
          onSelect={selectProduct}
          onCreate={(name) => {
            setInitialCreateName(name);
            setInitialBarcode(null);
            setStep("create");
          }}
        />
      ) : null}

      {step === "create" ? (
        <ProductCreateForm
          initialName={initialCreateName}
          initialBarcode={initialBarcode}
          submitLabel="Create and add stock"
          onCancel={() => setStep("manual")}
          onSubmit={(input) => createManual(input, initialBarcode ? "manual_after_scan" : "manual")}
        />
      ) : null}

      {step === "off_review" && offDraft ? (
        <ProductCreateForm
          initialProduct={offDraft}
          submitLabel="Save and add stock"
          onCancel={() => setStep("choose")}
          onSubmit={createFromOff}
        />
      ) : null}

      {step === "edit_product" && selectedProduct ? (
        <ProductCreateForm
          initialProduct={selectedProduct}
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
