
import node from '../components/ipfsNode/node'
import { PUBSUB_CHANNEL, requestPersonChat,changeCh, channelSend, sendMessg, onlineNodes, subscribe, ipfsId, getLatestMessages, output, db, DB_NAME } from '../components/ipfsNode/node'
import React from 'react'
import styled from 'styled-components'

let _this

const ContainerSend = styled.div`
  display: flex;
  margin-bottom: 25px;
`
const ContainerChat = styled.div`
  width:70%;
  text-align:center
`
const ContainerUsers = styled.div`
  width:30%;
  text-align:center
`
const ContainerFlex = styled.div`
 display:flex;
 padding:1em;
`
const InputNickname = styled.input`
 width:25%!important;
 margin-right:0.5em;
`
const OnlinesName = styled.p`
cursor:pointer;
margin-bottom: 0.5em!important;
    padding: 0.5em;
    background-color: rgba(0,0,0,0.1)!important;
   width: 95%;
    margin: 0 auto;
`

class chat extends React.Component {

  constructor(props) {
    super(props)

    _this = this

    this.state = {
      channel: PUBSUB_CHANNEL,
      onlines: [],
      _message: {
        nickname: "Daniel",
        message: "",
        status: "message"
      },
      ipfs: "",
      chatWith:"in ALL",
    }
  }

  render() {
    return (
      <ContainerFlex>
        <br></br>
                  <ContainerUsers>
            <h3>Onlines: {onlineNodes.length}</h3>
            <OnlinesName key="keyMaster" id={PUBSUB_CHANNEL} onClick={() => this.subscribeToOtherChannel(PUBSUB_CHANNEL)} ><b>ALL</b></OnlinesName>
            {_this.state.onlines.map((val, i) => <OnlinesName key={val.username + i} id={val.keiId} onClick={() => this.subscribeToOtherChannel(val)} >{val.username ? val.username : val} </OnlinesName>)}
          </ContainerUsers>
        <ContainerChat>
          <h3> Chat {this.state.chatWith}</h3>
          <textarea id="chatArea" name="chatArea" rows="10" cols="50" readOnly value={output}>
          </textarea>
          <br></br>
          <br></br>
          <ContainerSend>
            <InputNickname type="text" id="nickname" name="nickname" placeholder="nickname"></InputNickname>
            <input id="msg" name="msg" type="text" placeholder="type message" onKeyPress={(ev) => {
              if (ev.key === 'Enter') {
                _this.handleUpdateMsg()
                ev.preventDefault();
              }
            }}></input>
            <button onClick={this.handleUpdateMsg}>Send.</button>
          </ContainerSend>
        </ContainerChat>


      </ContainerFlex>

    )
  }

  handleUpdateMsg(event) {

    const msgValue = document.getElementById("msg").value
    const nicknameValue = document.getElementById("nickname").value
    _this.setState(prevState => ({
      ...prevState,
      message: {
        nickname: nicknameValue,
        msg: msgValue,
        channel: channelSend
      }
    }))
    sendMessg(nicknameValue, msgValue, channelSend, false);
    document.getElementById("msg").value = ""
  }
  /* updateChat() {
     console.log("updateChat")
     console.log(db.id)
     let latestMessages;
     db.events.on('replicated', () => {
       console.log("Message Entry")
       latestMessages = db.iterator({ limit: 5 }).collect();
       let output = "";
       output += latestMessages.map((e) => e.payload.value.nickname + ' : ' + e.payload.value.message).join('\n') + `\n`
       document.getElementById("chatArea").value = output;
     })
 
   }*/

  async subscribeToOtherChannel(value) {
    let channelName;
console.log(ipfsId.id);
console.log(value.keyId);
    let chatWith = _this.state.chatWith;
    if (value === PUBSUB_CHANNEL) {
      chatWith= "in ALL";
      console.log("pubsub chc")
      changeCh(PUBSUB_CHANNEL)
      channelName = await requestPersonChat(value,true)
    } else if (ipfsId.id != value.keyId) {
      chatWith= "with  " +value.username;
    channelName = await requestPersonChat(value.keyId)
    }
    // const msgValue = document.getElementById("msg").value
    // const nicknameValue = document.getElementById("nickname").value

    _this.setState(prevState => ({
      chatWith:chatWith,
      channel: channelName
    }))
  }

  componentDidMount() {
    let aux = true;
    node();

    setInterval(() => {
      _this.setState(prevState => ({
        ...prevState,
        onlines: onlineNodes,
      }))

      //   if (db && aux) { _this.updateChat(); aux = false; };
      //  document.getElementById("chatArea").value =output;


    }, 1000)

  }
  /*componentDidUpdate(prevProps) {

    if (this.props !== prevProps)
      this.setState({
        message: {
          nickname: "Daniel",
          text: ""
        }
      })
  }*/
}

export default chat
