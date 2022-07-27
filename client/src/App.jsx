import { useState, useEffect, useCallback } from 'react';
import { BsPhoneVibrate } from 'react-icons/bs';

import PeerConnection from './utils/PeerConnection';
import socket from './utils/socket';

import { MainWindow, CallWindow, CallModal } from './components';


export default function App() {
    const [callFrom, setCallFrom] = useState('');
    const [calling, setCalling] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [localSrc, setLocalSrc] = useState(null);
    const [remoteSrc, setRemoteSrc] = useState(null);

    const [peerConnection, setPeerConnection] = useState(null);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        socket.on('request', ({ from }) => {
            setCallFrom(from);
            setShowModal(true);
        })
    }, []);


    const finishCall = useCallback((isCaller) => {
        peerConnection.stop(isCaller);

        setPeerConnection(null);
        setConfig(null);

        setCalling(false);
        setShowModal(false);

        setLocalSrc(null);
        setRemoteSrc(null);
    }, [peerConnection]);

    useEffect(() => {
        if (!peerConnection) return;

        socket
            .on('call', (data) => {
                if (data.sdp) {
                    peerConnection.setRemoteDescription(data.sdp)

                    if (data.sdp.type === 'offer') {
                        peerConnection.createAnswer()
                    }
                } else {
                    peerConnection.addIceCandidate(data.candidate)
                }
            })
            .on('end', () => finishCall(false));
    }, [peerConnection, finishCall]);

    const startCall = (isCaller, remoteId, config) => {
        setShowModal(false);
        setCalling(true);
        setConfig(config);

        setPeerConnection(
            new PeerConnection(remoteId)
                .on('localStream', (stream) => {
                    setLocalSrc(stream)
                })
                .on('remoteStream', (stream) => {
                    setRemoteSrc(stream)
                    setCalling(false)
                })
                .start(isCaller, config)
        );
    };

    const rejectCall = () => {
        socket.emit('end', { to: callFrom });

        setShowModal(false);
    };

    return (
        <div className='app'>
            <h1>React WebRTC</h1>
            <MainWindow startCall={startCall} />
            {calling && (
                <div className='calling'>
                    <button disabled>
                        <BsPhoneVibrate />
                    </button>
                </div>
            )}
            {showModal && (
                <CallModal
                    callFrom={callFrom}
                    startCall={startCall}
                    rejectCall={rejectCall}
                />
            )}
            {remoteSrc && (
                <CallWindow
                    localSrc={localSrc}
                    remoteSrc={remoteSrc}
                    config={config}
                    mediaDevice={peerConnection?.mediaDevice}
                    finishCall={finishCall}
                />
            )}
        </div>
    );
};
