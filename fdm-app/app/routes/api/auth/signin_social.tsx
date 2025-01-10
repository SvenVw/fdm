import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

// Components


// Blocks

// Services
import { auth } from '@/lib/auth.server'


export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request)
}

// Action
export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request)
}