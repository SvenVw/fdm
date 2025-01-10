import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

// Components


// Blocks

// Services
import { auth } from '@/lib/auth.server'


export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    return auth.handler(request)
  } catch (error) {
    console.error('Social sign-in error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}

// Action
export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request)
}