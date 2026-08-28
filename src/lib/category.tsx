import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Category } from "@/types/domain";

interface CategoryContextValue {
  category: Category;
  setCategory: (c: Category) => void;
}

const CategoryContext = createContext<CategoryContextValue>({
  category: "PUTRA",
  setCategory: () => {},
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<Category>("PUTRA");
  const value = useMemo(() => ({ category, setCategory }), [category]);
  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategory() {
  return useContext(CategoryContext);
}
