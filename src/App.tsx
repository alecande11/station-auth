import { useEffect, useState } from 'react'
// IMP START - Quick Start
import { Web3AuthNoModal } from '@web3auth/no-modal'
import {
  CHAIN_NAMESPACES,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
} from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { CommonPrivateKeyProvider } from '@web3auth/base-provider'

import styles from './App.module.scss'
import { Banner, Button, Grid, LoadingCircular } from '@terra-money/station-ui'

const clientId =
  'BCLlpxx5TunINoj-QwVFEIC6Zfd-1AFe2lV0f5w7N0w21LsXNAxfj3V_rEEViiDLAU9W8U9rQUYACgYfI46JZz4'

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: 'phoenix-1', //
  rpcTarget: 'https://rpc-terra.tfl.foundation/',
  displayName: 'terra',
  blockExplorerUrl: 'https://finde.terra.dev',
  ticker: 'LUNA',
  tickerName: 'Luna',
}

const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig: chainConfig },
})

const web3auth = new Web3AuthNoModal({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
  uiConfig: {
    mode: 'dark',
    useLogoLoader: true,
    logoLight: 'https://station-assets.terra.money/img/station.png',
    logoDark: 'https://station-assets.terra.money/img/station.png',
    defaultLanguage: 'en',
    theme: {
      primary: '#18181B',
    },
  },
})

const openloginAdapter = new OpenloginAdapter()
web3auth.configureAdapter(openloginAdapter)

function App() {
  const params = new URLSearchParams(window.location.search)
  const rawRedirectURI = params.get('redirect_uri')
  const redirectURI = rawRedirectURI ? new URL(rawRedirectURI) : null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    web3auth.init().then(() => setLoading(false))
  }, [])

  const login = async (provder: string) => {
    setLoading(true)
    // IMP START - Login
    const provider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: provder,
    })

    if (!provider || !redirectURI) {
      // login failed
      setError('Authentication failed, please try again')
      setLoading(false)
      return
    }

    const user = await web3auth.getUserInfo()

    const key = (await provider.request({
      method: 'private_key',
    })) as string

    // send data back to the extension
    console.log(user, key)

    const data = Buffer.from(
      JSON.stringify({
        key,
        type: user.typeOfLogin,
        img: user.profileImage,
        name: user.name,
        email: user.email,
      }),
    ).toString('base64url')

    redirectURI.hash = `result=${data}`
    window.location.replace(redirectURI.toString())
    await web3auth.logout()
    //setLoading(false)
  }

  if (loading) {
    return <LoadingCircular />
  }

  return (
    <main className={styles.app}>
      <h1>Connect wallet</h1>
      <h2>
        We can put a subtitle here to give more info to the users, they can
        select which login provider to use from the buttons below
      </h2>
      {redirectURI ? (
        <Grid gap={16}>
          {error && <Banner variant='error' title={error} />}
          <Button
            variant='primary'
            label='Google'
            onClick={() => login('google')}
            className={styles.button}
          />
          <Button
            variant='primary'
            label='Github'
            onClick={() => login('github')}
            className={styles.button}
          />
        </Grid>
      ) : (
        <Banner
          variant='error'
          title={'No redirect URL provided ' + window.location.search}
        />
      )}
    </main>
  )
}

export default App
