import '@/styles/globals.css';
import dynamic from 'next/dynamic';

// Dynamic import providers to avoid SSR hydration issues
const ThemeContextProvider = dynamic(
  () => import('@/context/ThemeContext').then((mod) => mod.ThemeContextProvider),
  { ssr: false }
);

const SnackbarProvider = dynamic(
  () => import('notistack').then((mod) => mod.SnackbarProvider),
  { ssr: false }
);

export default function App({ Component, pageProps }) {
  return (
    <ThemeContextProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4000}
      >
        <Component {...pageProps} />
      </SnackbarProvider>
    </ThemeContextProvider>
  );
}

