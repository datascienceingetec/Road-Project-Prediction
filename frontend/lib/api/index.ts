export * from './types'

import { api as realApi } from './client'
// import { api as mockApi } from './mockClient'

// const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'

// export const api = useMock ? mockApi : realApi
export const api = realApi
