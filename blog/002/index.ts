import { z } from "zod"


type Path = '/flags'
type Method = 'GET' | 'POST'
type ApiEndpoint = `${Method} ${Path}`
const FeatureFlag = z.object({
    key: z.string().min(1),
    value: z.boolean()
})

type FeatureFlagType = z.infer<typeof FeatureFlag>

const responseHeaders = { headers: { 'Content-Type': 'application/json' } }

class CustomResponse extends Response {
    constructor(response: Record<any, any>, headerOverride?: Bun.ResponseInit) {
        super(JSON.stringify(response), {...responseHeaders, ...headerOverride})
    }
}

Bun.serve({
    port: 8080,
    async fetch(req) {
        
        try {
            const url = new URL(req.url)
            const method = req.method

            const apiEndpoint: ApiEndpoint = `${method as Method} ${url.pathname as Path}`

            console.log({ apiEndpoint })
            
            switch(apiEndpoint) {
                case 'POST /flags': {
                    const request = await req.json() as FeatureFlagType
                    if (!FeatureFlag.safeParse(request).success) {
                        return new CustomResponse({ message: 'Bad Request' }, { status: 400 })
                    }

                    const featureFlagToInsert = {
                        [request.key]: request.value
                    }

                    let updatedFeatureFlagInfo = featureFlagToInsert

                    // write to file
                    try {
                        const featureFlagFile = Bun.file('feature_flags.json', { type: "application/json" })
                        
                        if (await featureFlagFile.exists()) {
                            const featureFlagObject = JSON.parse(await featureFlagFile.text())
                            updatedFeatureFlagInfo = {
                                ...featureFlagObject,
                                ...updatedFeatureFlagInfo
                            }
                        }

                        Bun.write(featureFlagFile, JSON.stringify(updatedFeatureFlagInfo))
                    } catch(err) {
                        console.log(err)
                        return new CustomResponse({ message: 'Internal Server Error' }, { status: 500})
                    }

                    return new CustomResponse({ message: 'Created' }, { status: 201})
                }
                case 'GET /flags': {
                    const featureFlagFile = Bun.file('feature_flags.json', { type: "application/json" })

                    const key = url.searchParams.get('key')

                    if (!key) {
                        return new CustomResponse({ message: 'Key missing in request' }, { status: 404 })
                    }

                    if (await featureFlagFile.exists()) {
                        const featureFlagObject = JSON.parse(await featureFlagFile.text())
                        const value = featureFlagObject[key]

                        if (value === undefined) {
                            return new CustomResponse({ message: 'Key missing in request' }, { status: 404 })
                        }

                        const response: FeatureFlagType = {
                            key,
                            value
                        }

                        return new CustomResponse(response, { status: 201})
                    }
                }
            }
        } catch(err) {
            console.log(err)
            return new CustomResponse({ message: 'Internal Server Error' }, { status: 500})
        }

        return new CustomResponse({ message: 'Not found' }, { status: 404 })
    }
})