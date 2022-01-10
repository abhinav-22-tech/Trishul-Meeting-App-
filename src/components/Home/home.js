import {
  Avatar,
  Badge,
  Button,
  Popover,
  TextField,
  Divider,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentTest,
  DialogTitle,
  Slide,
  DialogContentText,
} from "@mui/material";
import {
  CameraAltOutlined,
  FeedbackOutlined,
  HelpOutline,
  PersonOutlined,
  Settings,
  Apps,
  VideoCallOutlined,
  Keyboard,
} from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { createTheme } from "@mui/material/styles";
import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../../lib/firebase";
import { useHistory } from "react-router-dom";
import "./home.css";
import Video from "twilio-video";
import Room from "../Room/Room";

const theme = createTheme();

const useStyles = makeStyles(() => ({
  large: {
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function Home() {
  const [currentUser, setCurrentUser] = useState(null);

  const [appState, setAppState] = useState("empty");
  const [anchorEl, setAnchorEl] = useState(null);
  const [date, setDate] = useState(new Date());

  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [username, setUsername] = useState("");

  const classes = useStyles();
  const history = useHistory();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const nameFirstChar =
    currentUser?.displayName !== null
      ? currentUser?.displayName.charAt(0).toUpperCase()
      : "";

  function stringToColor() {
    var str = currentUser?.displayName + "";
    var s = 50;
    var l = 50;
    var hash = 0;
    for (var i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);

    var h = hash % 360;
    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  }

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        setAppState("home");
        // console.log("currentUser: " + user);
        console.log(user.isAnonymous);
      } else {
        setCurrentUser(null);
        setAppState("login");
      }
    });

    const timer = setInterval(() => setDate(new Date()), 1000);
    return timer;
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.displayName);
    }
  }, [currentUser]);

  function randomRoom() {
    let uuid = Date.now();
    console.log(uuid);
    uuid = Math.floor(
      Math.random() * Math.floor(Math.random() * uuid.toString().slice(-9))
    );
    uuid =
      uuid.toString().substring(0, 3) +
      "-" +
      uuid.toString().substring(3, 6) +
      "-" +
      uuid.toString().substring(6, uuid.toString().length);
    console.log(uuid);
    setRoomName(uuid);
  }

  const linkToRoom = () => {
    if (roomName !== "") {
      console.log(currentUser.displayName);
      if (currentUser.isAnonymous && currentUser.displayName === "") {
        GuestLogin();
        handleSubmit();
      } else handleSubmit();
    }
  };

  function GuestLogin() {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
      setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
    };

    currentUser
      .updateProfile({
        displayName: "Jon",
      })
      .then(
        function () {
          // Profile updated successfully!
          var displayName = currentUser.displayName;
          console.log(`Display Name: ${displayName}`);
        },
        function (error) {
          // An error happened.
          console.log(`Guest Login Error: ${error}`);
        }
      );
    return (
      <div>
        <Button variant="outlined" onClick={handleClickOpen}>
          Slide in alert dialog
        </Button>
        <Dialog
          open={open}
          TransitionComponent={Transition}
          keepMounted
          onClose={handleClose}
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogTitle>{"Enter Your Name"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To move forward to video call, please enter your name here.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Name"
              type="name"
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  const siginOut = () => {
    if (currentUser.isAnonymous) currentUser.delete();
    auth.signOut();
  };

  const handleSubmit = useCallback(async () => {
    const data = await fetch(
      "https://twilio-meeting-server.herokuapp.com/video/token",
      {
        method: "POST",
        body: JSON.stringify({
          identity: username,
          room: roomName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());
    Video.connect(data.token, {
      name: roomName,
    })
      .then((room) => {
        setRoom(room);
      })
      .catch((err) => {
        console.error(err);
      });
    console.log(data);
  }, [roomName, username]);

  const handleLogout = useCallback(() => {
    setRoom((prevRoom) => {
      if (prevRoom) {
        prevRoom.localParticipant.tracks.forEach((trackPub) => {
          trackPub.track.stop();
        });
        prevRoom.disconnect();
      }
      return null;
    });
  }, []);

  // console.log("room name is", roomName);
  // console.log("username is", username);

  useEffect(() => {
    if (room) {
      const tidyUp = (event) => {
        if (event.persisted) {
          return;
        }
        if (room) {
          handleLogout();
        }
      };
      window.addEventListener("pagehide", tidyUp);
      window.addEventListener("beforeunload", tidyUp);
      return () => {
        window.removeEventListener("pagehide", tidyUp);
        window.removeEventListener("beforeunload", tidyUp);
      };
    }
  }, [room, handleLogout]);

  let render;
  if (room) {
    render = (
      <Room
        roomName={roomName}
        room={room}
        handleLogout={handleLogout}
        currentUser={currentUser}
      />
    );
  } else {
    render = (
      <div>
        <div className="home">
          <div className="home__left">
            <div className="home__buttons">
              <Button
                color="primary"
                variant="contained"
                className="home__createBTN"
                onClick={randomRoom}
              >
                <VideoCallOutlined />
                <p>New meeting</p>
              </Button>

              <TextField
                className="home__input"
                variant="outlined"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter a code or link"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Keyboard className="icon" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* <Link to={`/${roomName}`}> */}
              <Button
                color="primary"
                variant="outlined"
                className="home__joinBTN"
                disabled={roomName === ""}
                onClick={linkToRoom}
              >
                Join
              </Button>
              {/* </Link> */}

              {/* This signout button for development purpose */}

              <Button
                onClick={siginOut}
                variant="outlined"
                className="home__signOut"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return render;
}

export default Home;
