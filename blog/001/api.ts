import axios, { type Method } from 'axios'
import { paths } from './schema'

// Request shape
type GetPetsRequest = paths['/pets']['get']['parameters']
type GetPetByIdRequest = paths['/pets/{petId}']['get']['parameters']

// Response shape
type GetPetsResponse = paths['/pets']['get']['responses']['200']['content']['application/json']
type GetPetByIdResponse = paths['/pets/{petId}']['get']['responses']['200']['content']['application/json']

// API client
const petAPIClient = axios.create({
    baseURL: 'https://api.petstore.com/pets/'
})

petAPIClient.interceptors.request.use(
    async config => {
        return {
            ...config,
            headers: {
                'Authorization': 'Bearer abcd'
            } as any
        }
    }
)

// API definitions

export const getPets = ({
    params
} : {
    params: GetPetsRequest
}) => petAPIClient.request<GetPetsResponse>({
    method: 'GET' as Method,
    params: {
        limit: params.query?.limit
    }
})

export const getPetById = ({
    params
} : {
    params: GetPetByIdRequest
}) => petAPIClient.request<GetPetByIdResponse>({
    url: `${params.path.petId}/`,
    method: 'GET' as Method
})
