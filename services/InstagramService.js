const {IgApiClient} = require('instagram-private-api');
const {promisify} = require('util');
const {readFile} = require('fs');
const shttps = require("socks-proxy-agent");
const readFileAsync = promisify(readFile);

module.exports = class InstagramService{
    #client;
    #thread;
    #lastUserID;
    constructor(userName){
        this.#client = new IgApiClient();
        this.#client.state.generateDevice(userName);

        this.login = this.login.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendPhoto = this.sendPhoto.bind(this);
        this.sendVideo = this.sendVideo.bind(this);
    }

    async #loadAndCheckThread(userId){
        if(!userId && !this.#lastUserID)
            throw "User is not defined!";

        if(userId && userId != this.#lastUserID){
            this.#thread = this.#client.entity.directThread([userId.toString()]);
            this.#lastUserID = userId;
        }
    }
    async login(userName, password){
        await this.#client.account.login(userName, password);
    }
    async sendMessage(message, userID){
        await this.#loadAndCheckThread(userID);
        await this.#thread.broadcastText(message);
    }

    async getUserId(userName){
        return await this.#client.user.getIdByUsername(userName);
    }

    async sendPhoto(photoPath, userID){ 
        await this.#loadAndCheckThread(userID);    
        const photo = await readFileAsync(photoPath);
        await this.#thread.broadcastPhoto({
            file: photo
        });
    }

    async sendVideo(mediaPath, userID){
        const video = await readFileAsync(mediaPath);
        await this.#thread.broadcastVideo({
            video,
            transcodeDelay: 5 * 1000,
        }).catch(e => console.log(e));
    }

    setProxie(proxy){
        if(!this.#client.request.defaults.agentClass){
            this.#client.request.defaults.agentClass = shttps;
        }
        this.#client.request.defaults.agentOptions = proxy;
    }
}