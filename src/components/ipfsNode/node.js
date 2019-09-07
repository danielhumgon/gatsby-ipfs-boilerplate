// CUSTOMIZE THESE VARIABLES
const MASTER_MULTIADDR = "/p2p-circuit/ipfs/QmPTRtbFdhgP4g4rLTJ97Fu6RuoojmV7yEDRcN1zSKTY7R"
let DB_ADDRESS = "/orbitdb/zdpuAyTCPbmFJAhXhCZ8kFpTTKj42W9RdqLH6mbdqEnyXQXxc/example5343234"

const IPFS =typeof window !== `undefined` ? require('ipfs') : null 
let OrbitDB = typeof window !== `undefined` ? require('orbit-db') : null 
const channelsSuscriptions = [];
const getLimit = 10;
let latestMessages;
let ipfs
let ready = false;
let connectedMaster = new Date();
export let DB_NAME = "example534323488"
export let ipfsId;
export let db;
export const PUBSUB_CHANNEL = 'ipfsObitdb-chat'
export let dataFromMasterChannel;
export let userName = 'Node' + Math.floor(Math.random() * 900 + 100).toString();
export let onlineNodes = [];
export let output = '';
export let channelSend = 'ipfsObitdb-chat';
export const node = async () => {
  if(IPFS && OrbitDB){

  console.log("Starting...")
  // init ipfs node 
  ipfs = new IPFS({
    preload: { enabled: false },
    repo: './orbitdb/examples2/ipfs',
    start: true,
    EXPERIMENTAL: {
      pubsub: true,
    },
    config: {
      Addresses: {
        Swarm: [
          '/ip4/0.0.0.0/tcp/4016',
          '/ip4/127.0.0.1/tcp/4016/ws'
        ],
        API: '/ip4/127.0.0.1/tcp/5016',
        Gateway: '/ip4/127.0.0.1/tcp/9016',
        Delegates: []
      },
    },
    relay: {
      enabled: true, // enable circuit relay dialer and listener
      hop: {
        enabled: true // enable circuit relay HOP (make this node a relay)
      }
    },
    pubsub: true
  })
  ipfs.on('error', (err) => console.error(err))

  ipfs.on("replicated", () => {
    console.log(`replication event fired`);
  })

  ipfs.on('ready', async () => {
    ready = true;

    console.log("ready")

    ipfsId = await ipfs.id()
    await repeatedConnect(ipfs)
    console.log("conected!!!!!")
    createDb(DB_ADDRESS) // create db

    channelsSuscriptions.push(PUBSUB_CHANNEL)
    // subscribe to master node
    ipfs.pubsub.subscribe(PUBSUB_CHANNEL, (data) => {

      const jsonData = JSON.parse(data.data.toString())
      dataFromMasterChannel = jsonData
      if (jsonData.onlineNodes) {
        let onlineUsers = [];
        for (var nodes in jsonData.onlineNodes) {
          jsonData.onlineNodes[nodes].username ? onlineUsers.push(jsonData.onlineNodes[nodes]) : onlineUsers.push(nodes);
        }
        onlineNodes = [...onlineUsers]
         
      }
      if (jsonData.status === 'online' && jsonData.username === 'system') {
        connectedMaster = new Date()
      }
    })
    //Returns the peers that are subscribed to one topic.
    /*  ipfs.pubsub.peers(PUBSUB_CHANNEL, (err, peerIds) => {
        if (err) {
          return console.error(`failed to get peers subscribed to ${PUBSUB_CHANNEL}`, err)
        }
        onlineNodes = peerIds;
        console.log(peerIds)
      })*/
    // subscribe to my node 
    channelsSuscriptions.push(ipfsId.id)
    ipfs.pubsub.subscribe(ipfsId.id, (data) => {
      const jsonData = JSON.parse(data.data.toString())
      console.log("jsondataa ...")
      console.log(jsonData)
      console.log("compare db : ")
      console.log("dbfromchannel: " + jsonData.dbId)
      console.log("localdb: " + db.id)
      console.log("my_id: " + ipfsId.id)
      if (jsonData.peer1 === ipfsId.id) {

        channelSend = jsonData.channelName
        console.log("change channel to : " + jsonData.channelName)
        let flag = true;
        createDb(jsonData.dbName, true)

        for (let i = 0; i < channelsSuscriptions.length; i++)
          // verify existing subscriptions
          if (flag && channelsSuscriptions[i] === jsonData.channelName) flag = false;
        flag && subscribe(jsonData.channelName)
        //  setTimeout(() => { queryGet() }, 300);

      }

    })
    // sending online status to master node 
    setInterval(() => {
    //  verifyConectionWithMaster();
      const msg = { status: 'online', username: userName }
      const msgEncoded = ipfs.types.Buffer.from(JSON.stringify(msg))
      ipfs.pubsub.publish(PUBSUB_CHANNEL, msgEncoded, (err) => {
        if (err) {
          return console.error(`failed to publish to ${PUBSUB_CHANNEL}`, err)
        }
        // msg was broadcasted
        //console.log(`published to ${PUBSUB_CHANNEL}`)
      })
    }, 1000)

  })
  }
}
export const requestPersonChat = async (peerClient, reset) => {
  if (reset) {
    console.log("reset : " + reset)
    createDb(DB_ADDRESS)
    return PUBSUB_CHANNEL
  }
  const myID = ipfsId.id
  const clientId = peerClient.toString()
  const newChannelName = myID + clientId
  const newDbName = newChannelName + "1232772"
  const msg = { status: 'requestChat', channelName: newChannelName, dbName: newDbName, peer1: myID, peer2: clientId, dbId: db.id }
  const msgEncoded = ipfs.types.Buffer.from(JSON.stringify(msg))
  console.log("publish request : " + reset)
  ipfs.pubsub.publish(PUBSUB_CHANNEL, msgEncoded)

  return newChannelName;
}

export const subscribe = async (channelName) => {
  if (!ready) return;
  channelsSuscriptions.push(channelName)
  ipfs.pubsub.subscribe(channelName, (data) => {
    console.log("room: " + channelName);
    const jsonData = JSON.parse(data.data.toString())
    if (jsonData.status === 'message') {
      query(jsonData.username, jsonData.message);

    }
  })
  console.log("subscrito a : " + channelName);
}
export const sendMessg = async (nickname, message, channel, useLocalChannel) => {
  if (!ready) return;
  let ch = channel
  if (useLocalChannel) ch = channelSend
  userName = nickname;
  console.log("sending msg")
  const id = ipfs.id()
  const msgText = { username: nickname, message: message, status: "message" }
  const msgEncoded = ipfs.types.Buffer.from(JSON.stringify(msgText))
  console.log("channel: " + ch)
  ipfs.pubsub.publish(ch, msgEncoded)
  if (channelSend == PUBSUB_CHANNEL) query(userName, msgText.message);
}
export const changeCh = async (NEW_CH) => {


  channelSend = NEW_CH

}
const createDb = async (db_addrs, createNew = false) => {
  const optionsDb = {
    directory: './orbitdb3/examplesipfs/eventlog'
  }
  try {
    const access = {
      accessController: {
        write: ["*"],
        overwrite: true
      }
    };
    if (createNew) {

      const orbitdb = await OrbitDB.createInstance(ipfs, optionsDb)
      db = await orbitdb.eventlog(db_addrs, access)
      await db.load()
      console.log(`db id: ${db.id}`)
      console.log(db);
      queryGet();
    } else {
      const orbitdb = await OrbitDB.createInstance(ipfs, optionsDb)
      db = await orbitdb.eventlog(db_addrs, access)
      await db.load()
      console.log(`db id: ${db.id}`)
      console.log(db);
      queryGet();
    }
    db.events.on('replicated', (db_addrs) => {
      // if(channelSend ==PUBSUB_CHANNEL)
      queryGet();
      console.log("replicated event")
    })
  } catch (e) {
    console.error(e)
  }



}
const verifyConectionWithMaster = async () => {
  if (((new Date() - connectedMaster) / 1500) > 5) {
    onlineNodes = []
  }
}
const queryGet = async () => {
  try {
    latestMessages = db.iterator({ limit: 10 }).collect();
    output = "";
    //desencryt  here e.payload.value
    output += latestMessages.map((e) => e.payload.value.nickname + ' : ' + e.payload.value.message).join('\n') + `\n`
    console.log(output)
  } catch (e) {
    console.error(e)
  }
}

const query = async (nickname, message) => {
  try {
    console.log("adding entry")
    const entry = { nickname: nickname, message: message }
    //encryt  entry here
    await db.add(entry)
    queryGet()
  } catch (e) {
    console.error(e)

  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function repeatedConnect(ipfs) {
  try {
    console.log("trying connect to master")
    await ipfs.swarm.connect(MASTER_MULTIADDR)
  } catch (err) {
    await sleep(5000)
    await repeatedConnect(ipfs)
  }
}



export default node







