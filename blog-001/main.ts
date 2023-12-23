import { getPets } from "./api"

const fetchAllPets = async () => {
    try {
        const result = await getPets({
            params: {
                query: {
                    limit: 1
                }
            }
        })

        console.log(result.data.content.)
    } catch (err) {
        console.log(err)
    }
}