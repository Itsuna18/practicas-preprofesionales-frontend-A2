import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge no conoce la escala tipográfica propia (tailwind.config.ts:
// text-11 … text-40) y la tomaba por colores: al juntar `text-surface` con
// `text-14` borraba el color, y los botones primarios quedaban con texto
// oscuro sobre fondo oscuro. Se declara como tamaño de letra para que ambas
// clases convivan.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["11", "12", "13", "14", "15", "16", "17", "19", "20", "22", "26", "28", "40"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Concuerda un sustantivo con su cantidad: `plural(1, 'oferta', 'ofertas')`
 * devuelve `"1 oferta"`. Vive acá para que las pantallas no repitan el mismo
 * ternario en cada contador.
 */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
