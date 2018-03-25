//React
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

//Actions
import { processImage, addPlayer, removePlayer, recieveReactions } from "../../features/users/UsersActions";

//Selectors
import { selectMyEmotions } from "../../features/users/UserSelectors";

//Logo
import logo from "../../../src/memelikey.svg";

//Components
import MemeWidget from "../memegame/MemeWidget";
import { OTSession, OTPublisher, OTStreams, OTSubscriber } from "opentok-react";
import { Breadcrumb, Col, Layout, Menu, Row } from "antd";
const { Header, Content, Footer } = Layout;

class Room extends Component {
  componentDidMount() {
    const that = this;
    //Session Connection Listeners
    this.sessionRef.sessionHelper.session.on("connectionCreated", event => {
      const { addPlayer } = that.props;
      let connections = {};
      event.connections.forEach(connection => {
        connections[connection.connectionId] = {};
      });
      addPlayer(connections);
    });
    this.sessionRef.sessionHelper.session.on("connectionDestroyed", event => {
      that.props.removePlayer(event.connection.connectionId);
    });
    //Broadcasting Listeners
    this.getReactions();
  }

  getReactions = () => {
    const that = this;
    const { recieveReactions } = that.props;
    this.sessionRef.sessionHelper.session.on("signal:msg", event => {
      const subscriberData = JSON.parse(event.data);
      let reactionData = {};
      reactionData[subscriberData.connectionId] = subscriberData.faceData;
      recieveReactions(reactionData);
    });
  };

  sendMyEmotions = () => {
    const { currentEmotions } = this.props;
    const { session } = this.sessionRef.sessionHelper;
    session.signal(
      {
        type: "msg",
        data: JSON.stringify({
          connectionId: session.connection.connectionId,
          faceData: currentEmotions
        })
      },
      error => {
        if (error) {
          console.error("Error sending signal:" + error.name, error.message);
        }
      }
    );
  };

  getMyEmotions = () => {
    const { processImage } = this.props;
    const b64Data = this.publisherRef.getPublisher().getImgData();
    const returnOptions = {
      returnFaceId: "true",
      returnFaceLandmarks: "false",
      returnFaceAttributes: "smile,emotion"
    };
    const params = Object.assign({}, { b64Data }, returnOptions);
    processImage(params);
  };

  subscriberProperties = {
    preferredFrameRate: 15,
    showControls: false
  };

  subscriberEventHandlers = {
    videoDisabled: event => {
      console.log("Subscriber video disabled!");
    },
    videoEnabled: event => {
      console.log("Subscriber video enabled!");
    }
  };

  render() {
    const { currentEmotions } = this.props;
    return (
      <div className="App">
        <Layout className="layout" style={{ height: "100vh" }}>
          <Header style={this.headerStyle}>
            <Menu theme="dark" mode="horizontal" style={this.menuStyle}>
              <Menu.Item>
                <img src={logo} height="70" width="70" alt="logo" />mème brûlée
              </Menu.Item>
            </Menu>
          </Header>
          <Content style={contentStyle}>
            <Breadcrumb style={breadcrumbStyle}>
              <Breadcrumb.Item>Welcome to the "Variable Name of Room" Room!</Breadcrumb.Item>
            </Breadcrumb>
            <Row type="flex" justify="space-around">
              <Col span={14}>
                <div style={boxStyle}>
                  <OTSession
                    ref={instance => {
                      this.sessionRef = instance;
                    }}
                    apiKey={process.env.REACT_APP_API_KEY}
                    sessionId={process.env.REACT_APP_SESSION_ID}
                    token={process.env.REACT_APP_TOKEN_ID}
                  >
                    <OTPublisher
                      ref={instance => {
                        this.publisherRef = instance;
                      }}
                    />
                    <OTStreams>
                      <OTSubscriber properties={this.subscriberProperties} eventHandlers={this.subscriberEventHandlers} />
                    </OTStreams>
                  </OTSession>
                  <button onClick={() => this.getMyEmotions()}>Get My Emotions </button>
                  <button onClick={() => this.sendMyEmotions()}>Broadcast Emotions </button>
                  <div>Current Emotions: {JSON.stringify(currentEmotions)}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={boxStyle}>
                  <center>
                    <MemeWidget />
                  </center>
                </div>
              </Col>
            </Row>
          </Content>
          <Footer style={footerStyle}>Reactathon Hackathon © 2018 Created by Aztec Game Lab (Possible chat area)</Footer>
        </Layout>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentEmotions: selectMyEmotions(state)
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      processImage,
      addPlayer,
      removePlayer,
      recieveReactions
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Room);

//Inline Styles
const contentStyle = {
  position: "absolute",
  overflow: "auto",
  width: "100%",
  background: "#cccccc",
  padding: "0 50px",
  top: 64,
  bottom: 64
};

const breadcrumbStyle = {
  margin: "16px 0"
};

const boxStyle = {
  height: "75vh",
  background: "#fff",
  padding: 24
};

const footerStyle = {
  position: "absolute",
  overflow: "hidden",
  height: "64px",
  width: "100%",
  left: 0,
  bottom: 0,
  textAlign: "center"
};
