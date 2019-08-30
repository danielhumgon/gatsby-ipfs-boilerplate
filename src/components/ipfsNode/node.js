// CUSTOMIZE THESE VARIABLES
const MASTER_MULTIADDR = "/ip4/192.168.1.207/tcp/4004/ipfs/QmRFFTmLG6y8DkJKXQsh2JXtyLvwN5QUog1vZJPtrCddR3"
const IPFS = require('ipfs')
let OrbitDB = require('orbit-db')
const channelsSuscriptions = [];
const getLimit = 10;
let latestMessages;
let ipfs
let ready = false;
export let DB_NAME = "example5343234"
export let ipfsId;
export let db;
export const PUBSUB_CHANNEL = 'ipfs-test-chat-app2'
export let dataFromMasterChannel;
export let userName = 'Node11231';
export let onlineNodes = [];
export let output = '';
export let channelSend = 'ipfs-test-chat-app2';
export const node = async () => {

  console.log("Starting...")
  // init ipfs node 
  ipfs = new IPFS({
    preload: { enabled: false },
    repo: './orbitdb/examples/ipfs',
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
    // console.log(ipfsId)
    let onlineUsers = [];
    await ipfs.swarm.connect(MASTER_MULTIADDR)
    console.log("conected!!!!!")
    createDb(DB_NAME) // create db

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


    })

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
        if (jsonData.exist) {
          channelSend = jsonData.channelName
          console.log("change channel to : " + jsonData.channelName)
        }
        let flag = true;
        createDb(jsonData.dbName)
        for (let i = 0; i < channelsSuscriptions.length; i++)
          // verify existing subscriptions
          if (flag && channelsSuscriptions[i] === jsonData.channelName) flag = false;
        flag && subscribe(jsonData.channelName)
        setTimeout(() => { queryGet() }, 500);

      }

    })
    // sending online status to master node 
    setInterval(() => {
      const msg = { status: 'online', username: userName }
      const msgEncoded = ipfs.types.Buffer.from(JSON.stringify(msg))
      ipfs.pubsub.publish(PUBSUB_CHANNEL, msgEncoded)
    }, 1000)

  })
}

export const requestPersonChat = async (peerClient,reset) => {
if(reset){
createDb(DB_NAME);
return PUBSUB_CHANNEL
}
  const myID = ipfsId.id//.substring(0, 3);
  const clientId = peerClient.toString()//.substring(0, 3);
  const newChannelName = myID + clientId
  const newDbName = newChannelName + "1232772"
  const msg = { status: 'requestChat', channelName: newChannelName, dbName: newDbName, peer1: myID, peer2: clientId, dbId: db.id }
  const msgEncoded = ipfs.types.Buffer.from(JSON.stringify(msg))
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
      console.log("msg: " + jsonData.message);
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
}
export const changeCh = async (NEW_CH) => {

 
      channelSend = NEW_CH

}
const createDb = async (DB_NAME) => {

  try {

    const access = {
      // Give write access to everyone
      write: ["*"]
    };

    const orbitdb = new OrbitDB(ipfs, './orbitdb/examples/eventlog')
    db = await orbitdb.eventlog(DB_NAME, access)//orbitdb.eventlog(DB_NAME, access)
    await db.load()
    console.log(`db id: ${db.id}`)
    console.log(db);
    queryGet();

    db.events.on('replicated', () => {
      if(channelSend ==PUBSUB_CHANNEL)
        queryGet();
      console.log("replicated")
    })
  } catch (e) {
    console.log("Errrrr")
    console.error(e)
  }



}
const queryGet = async () => {
  try {

    latestMessages = db.iterator({ limit: 10 }).collect();
    output = "";
     //desencryt  here e.payload.value
    output += latestMessages.map((e) => e.payload.value.nickname + ' : ' + e.payload.value.message).join('\n') + `\n`

  } catch (e) {
    console.error(e)
    process.exit(1)
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
    process.exit(1)
  }
}


export default node







