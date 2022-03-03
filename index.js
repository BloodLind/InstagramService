const InstagramService = require('./services/InstagramService');
const fs = require('fs');
const path = require('path');
var readlineSync = require('readline-sync');
const { env } = require('process');
const { randomInt } = require('crypto');

var accounts = [];
var targets = [];
var proxies = new Array();
var isProxyEnabled = false;
var interval = 20;
var messsage = 
[
    {
        type:"text",
        data: "Укрїна понад усе. Тест"
    },
    {
        type: "photo",
        data: "resources/media/test.jpg"
    }
]

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function loadProxies(){
    try{
        let proxy = fs.readFileSync(path.join(process.cwd(), 'resources/proxy.txt')).toString().split('\r\n');
        for(i in proxy){
            let line = proxy[i].split(':');
            proxies.push({hostname: line[0], port: Number.parseInt(line[1]), protocol:"socks5:"});
        }
    }
    catch{
        console.log("No proxies found!");
    }
}

function parseURL(instagramURL){
    let account =  instagramURL.includes("https://instagram.com/") ? instagramURL.substring("https://instagram.com/".length) : 
    instagramURL.substring("https://www.instagram.com/".length);
    let parametersIndex = account.indexOf('?');
    if(parametersIndex == -1){
        parametersIndex = account.indexOf('/');
    }
    return parametersIndex != -1 ? account.substring(0, parametersIndex) : account;
}

function filterText(text){
    res = new Array();
    for(let line in text){
        if(text[line].includes("https://instagram.com/") || text[line].includes("https://www.instagram.com/")) {
            res.push(parseURL(text[line]));
        }
        else if(text[line].match(/^[a-zA-Z0-9._]+$/))
            res.push(text[line]);
    }
    return res;
}

function Initialize(){
    try{
        let accountFile = readlineSync.question("Input path to your accounts file (Default is 'resources/accounts.json'):",{
            defaultInput: 'resources/accounts.json'});
        accounts = JSON.parse(fs.readFileSync(path.isAbsolute(accountFile) ? accountFile : path.join(process.cwd(), accountFile)).toString());    

        let targetsFile = readlineSync.question("Input path to your accounts file (default is 'resources/targets.txt'):", {
            defaultInput:"resources/targets.txt"
        });
        
        targets = filterText(fs.readFileSync(path.isAbsolute(targetsFile) ? targetsFile : path.join(process.cwd(), targetsFile)).toString().split('\r\n'));
        setMessageFile();
    }
    catch{
        let res = readlineSync.keyInYN("Some Files are not valid. Will we try again?");
        if(res){
            console.clear();
            Initialize();
        }
        process.exit();
    }
}

async function spam(){
    for(i in accounts){
        
            const service = new InstagramService(accounts[i].username);
            await service.login(accounts[i].username, accounts[i].password);
            if(isProxyEnabled){
                service.setProxie(proxies[Math.abs(randomInt(proxies.length))]);
            }
            
            for(let target in targets){
                if(target % 10 == 0 && isProxyEnabled){
                    service.setProxie(proxies[Math.abs(randomInt(proxies.length))]);
                }
                let id = await service.getUserId(targets[target]);
                for(let index in messsage){
                    console.log("\x1b[0m", "Sending part of messagе...")
                    switch(messsage[index].type){
                        case "text": 
                        await service.sendMessage(messsage[index].data,id);
                        break;
                        case "photo":
                            await service.sendPhoto(messsage[index].data, id);
                            break;
                            case "video":
                                await service.sendVideo(messsage[index].data, id);    
                                break;
                            }
                        }
                        console.warn("\x1b[36m",`${accounts[i].username} send message to ${targets[target]}`);
                        await sleep(interval)
                    }
                }
            }

function setMessageFile(){
    try{
        let messsageFile = readlineSync.question("Input path of message file (Default resources/message.json):", {
            defaultInput: 'resources/message.json'
        });
        messsage = JSON.parse(fs.readFileSync(path.isAbsolute(messsageFile) ? messsageFile : path.join(process.cwd(), messsageFile)).toString());
        console.log("New message loaded!");
    }
    catch{
        console.log("Check your file/file path and try again!");
    }
}

function changeInterval(){
    let newInterval = readlineSync.questionInt("Input new interval: ");
    interval = Math.abs(newInterval);
    console.log("New interval - ", interval);
}

async function Main(){
    loadProxies();
    Initialize();
    
    while(true){
        let i = readlineSync.keyInSelect(["Exit","Start spam", 'Set message file',"Change interval", "Enable Proxy"]);
        switch(i){
            case 0: 
                console.clear();
                return;
            case 1:
                await spam();
                break;
            case 2: 
                setMessageFile();
                break;
            case 3: 
                changeInterval();
                break;
            case 4:
                isProxyEnabled = !isProxyEnabled;
                console.log("proxy - ", isProxyEnabled);
                break;    
            }
            readlineSync.keyInPause();
            console.clear();
            console.log("\x1b[0m", "");
    }
}

Main();