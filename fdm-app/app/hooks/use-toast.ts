/**
 * @file This file implements a custom toast notification system, inspired by `react-hot-toast`.
 *
 * It provides a `useToast` hook and a `toast` function to create and manage toast notifications
 * programmatically. The system is built using a React reducer and a global state listener pattern,
 * allowing any component to display toasts without complex prop drilling.
 *
 * Key features include:
 * - A central state management system for all toasts.
 * - Functions to add, update, dismiss, and remove toasts.
 * - A limit on the number of visible toasts.
 * - A delayed removal queue to allow for exit animations.
 *
 * @packageDocumentation
 */
"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "~/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: ToastActionElement
}

const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

type ActionType = typeof actionTypes

type Action =
    | {
          type: ActionType["ADD_TOAST"]
          toast: ToasterToast
      }
    | {
          type: ActionType["UPDATE_TOAST"]
          toast: Partial<ToasterToast>
      }
    | {
          type: ActionType["DISMISS_TOAST"]
          toastId?: ToasterToast["id"]
      }
    | {
          type: ActionType["REMOVE_TOAST"]
          toastId?: ToasterToast["id"]
      }

interface State {
    toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Adds a toast to a removal queue. After a delay, a "REMOVE_TOAST" action is dispatched.
 * @internal
 */
const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId))
        toastTimeouts.delete(toastId)
        return
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId)
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId,
        })
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(toastId, timeout)
}

/**
 * The reducer function for managing toast state.
 * @internal
 */
export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }

        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t,
                ),
            }

        case "DISMISS_TOAST": {
            const { toastId } = action
            if (toastId) {
                addToRemoveQueue(toastId)
            } else {
                state.toasts.forEach((toast) => {
                    addToRemoveQueue(toast.id)
                })
            }

            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === toastId || toastId === undefined
                        ? { ...t, open: false }
                        : t,
                ),
            }
        }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: [],
                }
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            }
    }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

/**
 * Dispatches an action to the reducer and notifies all subscribed listeners.
 * @internal
 */
function dispatch(action: Action) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => {
        listener(memoryState)
    })
}

type Toast = Omit<ToasterToast, "id">

/**
 * Creates and displays a new toast notification.
 * @param props - The properties of the toast to display.
 * @returns An object with methods to `update` or `dismiss` the toast.
 */
function toast({ ...props }: Toast) {
    const id = genId()

    const update = (props: ToasterToast) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
        })
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss()
            },
        },
    })

    return {
        id: id,
        dismiss,
        update,
    }
}

/**
 * A custom hook for accessing the toast state and dispatcher functions.
 *
 * This hook subscribes a component to the global toast state. It returns the current
 * list of toasts, along with the `toast` function to create new toasts and the
 * `dismiss` function to remove them.
 *
 * @returns An object containing the current `toasts` array and the `toast` and `dismiss` functions.
 */
function useToast() {
    const [state, setState] = React.useState<State>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) =>
            dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}

export { useToast, toast }
