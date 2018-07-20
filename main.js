'use strict'

const OrbitDB = require('orbit-db')
var IPFS = require('ipfs');
const Room = require('ipfs-pubsub-room')
const CryptoEdDSAUtil = require('./cryptoEdDSAUtil');
const crypto = require('crypto');

const SHA256 = require("crypto-js/sha256");

const node = new IPFS({ repo: "ipfss/" + String(Math.random() + Date.now()),
start: true,
EXPERIMENTAL: {
  pubsub: true,
},
config: {
  Addresses: {
    Swarm: [
      // Use IPFS dev signal server
      // '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star',
      '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
      // Use local signal server
      // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
    ]
  },
}
})


//const room = Room(node, 'ins')
var orbitdb;
var profileDB;
node.on('ready', async () => {
    console.log("starting Orbit...")
    orbitdb = new OrbitDB(node)
    profileDB = await orbitdb.open("/orbitdb/QmSexedp5pUNuHrXGDZ9NZXtWCQf156Lfar9mqstRZwr77/DSN", { sync: true })   
    console.log("ready");
    profileDB.events.on('replicated', (address) => {
        console.log(profileDB.iterator({ limit: -1 }).collect().map((e) => e.payload.value))
    })
    profileDB.load()
})


function store(){
    var toStore = "Nonzi";

    room.broadcast("Nonzi");

    node.files.add(Buffer.from(toStore), (err, res) => {
        if (err || !res) {
            return console.error('ipfs add error', err, res)
        }

        res.forEach((file) => {
            if (file && file.hash) {
            console.log('successfully stored', file.hash)
            display('QmTeW79w7QQ6Npa3b1d5tANreCDxF2iDaAPsDvW6KtLmfB/index.html')
            }
        })
    })
}

function display(hash){
    node.files.cat(hash, (err, data) => {
        if (err) { return console.error('ipfs cat error', err) }
        console.log(String(data));
    })
}

async function orbit(){
    await profileDB.add("Nonzi")
    const all = profileDB.iterator({ limit: -1 }).collect().map((e) => e.payload.value)
    console.log(all);
}

async function createdb(){
    var name = "DSN"
    profileDB = await orbitdb.open(name, {
        // If database doesn't exist, create it
        create: true, 
        overwrite: true,
        // Load only the local version of the database, 
        // don't load the latest from the network yet
        localOnly: false,
        type: "feed",
        write: ['*'],
    })
    console.log(profileDB.address.toString())
}

async function createProfile(){
    var username = document.getElementById('name').value;
    var PublicKey = document.getElementById('publicKey').value;
    var privateKey = document.getElementById('privateKey').value;
    var keyPair = CryptoEdDSAUtil.generateKeyPairFromSecret(privateKey);
    var Type = "profile";
    var Metadata = {};
    var Hash = SHA256(Type + username + PublicKey + Metadata).toString();
    var Sign = CryptoEdDSAUtil.signHash(keyPair, Hash);
    var profile = {type: Type, name: username, publicKey: PublicKey, metadata: Metadata, hash: Hash, sign: Sign}
    await profileDB.add(JSON.stringify(profile));
    const all = profileDB.iterator({ limit: -1 }).collect().map((e) => e.payload.value)
    console.log(all);
}

async function createKeyPair(){
    var privateKey = CryptoEdDSAUtil.generateSecret(crypto.randomBytes(32).toString('hex'));
    var keyPair = CryptoEdDSAUtil.generateKeyPairFromSecret(privateKey);
    var publicKey = CryptoEdDSAUtil.toHex(keyPair.getPublic());
    console.log("privateKey: " + privateKey);
    console.log("publicKey: " + publicKey);
}

async function post(){
    var Type = "post";
    var Time =  Date.now();
    var Metadata = {};
    var post = {type: Type, time: Time, metadata: Metadata};
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createdb').onclick = createdb
    document.getElementById('store').onclick = orbit
    document.getElementById('post').onclick = post
    document.getElementById('profile').onclick = createProfile
    document.getElementById('createKeyPair').onclick = createKeyPair
})
