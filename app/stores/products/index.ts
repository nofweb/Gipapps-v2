import { defineStore } from 'pinia'
import type { ProductId } from '~/types/product'
import { PRODUCTS } from '~/utils/products'

interface ProductsState {
  activeProduct: ProductId
  recentlyUsed: ProductId[]
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    activeProduct: 'motor',
    recentlyUsed: ['motor'],
  }),

  getters: {
    activeProductMeta(state) {
      return PRODUCTS.find(p => p.id === state.activeProduct) ?? PRODUCTS[0]
    },
  },

  actions: {
    selectProduct(id: ProductId) {
      this.activeProduct = id
      this.recentlyUsed = [id, ...this.recentlyUsed.filter(x => x !== id)].slice(0, 5)
    },
  },

  persist: {
    pick: ['activeProduct', 'recentlyUsed'],
  },
})
