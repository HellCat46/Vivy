import { Vivy } from "../Vivy";


module.exports = {
    once: true,
    async execute(client : Vivy){
        console.log("Logged in as "+ client.user?.username);
    }
}