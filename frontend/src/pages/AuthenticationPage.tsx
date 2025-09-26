import { ForgotPasswordForm } from '../components/forgot-password-form';
import { LoginForm } from '../components/login-form';
import { SignUpForm } from '../components/sign-up-form';
import { UpdatePasswordForm } from '../components/update-password-form';
import { useParams } from 'react-router-dom';

// You might want to wrap the forms in a centering container here

export function AuthenticationPage() {
  const { formType } = useParams<{ formType: string }>();

  let ComponentToRender;

  switch (formType) {
    case 'login':
      ComponentToRender = LoginForm;
      break;
    case 'sign-up': // Note: Changing to 'signup' for consistency with the new route
      ComponentToRender = SignUpForm;
      break;
    case 'forgot-password':
      ComponentToRender = ForgotPasswordForm;
      break;
    case 'update-password':
      ComponentToRender = UpdatePasswordForm;
      break;
    default:
      // You can redirect to login or render a 404/error component
      ComponentToRender = LoginForm; // Default to login
  }

  // The UpdatePasswordForm should likely only be accessible via the link in the email,
  // which Supabase handles by redirecting to a pre-defined URL (like /update-password)
  // that contains the necessary hash/query parameters.

  // It's crucial for the `UpdatePasswordForm` that the user lands on the correct
  // route with the tokens provided by the reset email link. If your Supabase redirect
  // is hardcoded to `/update-password`, you'll need a mechanism to pass
  // those tokens to the form if you move it under `/auth/:formType`.
  // For simplicity, it's sometimes kept as a separate route:
  // <Route path="/update-password" element={<UpdatePasswordForm />}/>

  // If you keep the separate routes for now, your `App.tsx` would look like this:
  /*
  <Route path="auth/login" element={<LoginForm />}/> // Change to /auth/login
  <Route path="/sign-up" element={<SignUpForm />}/> // Change to /auth/signup
  <Route path="/forgot-password" element={<ForgotPasswordForm />}/> // Change to /auth/forgot-password
  <Route path="/update-password" element={<UpdatePasswordForm />}/> // Keep this one separate or handle token parsing.
  */

  // For the best implementation:
  // Use <Route path="/auth/:formType" element={<AuthenticationPage />} />
  // and handle the forms within it.

  if (!ComponentToRender) return <div>404 Not Found</div>; // Or a proper redirect/error

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] p-4">
      {' '}
      {/* Example container */}
      <ComponentToRender />
    </div>
  );
}
