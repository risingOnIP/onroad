import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs

    const user = await supabase.auth.getUser();
    let userProfile = null;

    if (user.data?.user?.id) {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("user_id", user.data.user.id)
        .single();

      if (profileError) {
      } else {
        userProfile = data;
      }
    }

    // protected routes
    const routesProtected = ["protected", "support"];

    // Protected routes
    for (const route of routesProtected) {
      if (request.nextUrl.pathname.startsWith(`/${route}`) && user.error) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      const rolesProtected = ["broker", "realtor", "client", "tenant"];

      // Protection for role-specific routes
      for (const role of rolesProtected) {
        if (request.nextUrl.pathname.startsWith(`/${role}/`)) {
          // If no user profile or role doesn't match, redirect to error
          if (!userProfile || role !== userProfile.role) {
            return NextResponse.redirect(new URL("/error", request.url));
          }
        }
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
