import { useGoogleAnalytics } from '../hooks/useGoogleAnalytics'

function MyApp({ Component, pageProps }) {
  useGoogleAnalytics()

  return <Component {...pageProps} />
}

export default MyApp