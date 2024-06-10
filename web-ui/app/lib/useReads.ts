import { create } from "zustand";

type Store = {
	readIds: string[];
	clearReads: () => void;
	addRead: (id: string) => void;
};

export const useReads = create<Store>((set) => ({
	readIds: [],
	clearReads: () => set({ readIds: [] }),
	addRead: (id: string) =>
		set((state) => ({ readIds: [...state.readIds, id] })),
}));
