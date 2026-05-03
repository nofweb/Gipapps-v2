import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-500 active:bg-primary-600 shadow-sm',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-tertiary-500 active:bg-tertiary-600',
        outline:
          'border-2 border-primary text-primary-700 hover:bg-primary hover:text-primary-foreground bg-transparent',
        secondary:
          'bg-secondary-800 text-white hover:bg-secondary-700 active:bg-secondary-900',
        ghost:
          'text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200',
        link: 'text-primary-700 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
