import Emitter from './Emitter'
import MediaDevice from './MediaDevice'
import socket from './socket'

const CONFIG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] }

class PeerConnection extends Emitter {
    constructor(remoteId) {
        super()
        this.remoteId = remoteId

        this.rtcPeerConnection = new RTCPeerConnection(CONFIG)
        this.rtcPeerConnection.onicecandidate = ({ candidate }) => {
            socket.emit('call', {
                to: this.remoteId,
                candidate
            })
        }
        this.rtcPeerConnection.ontrack = ({ streams }) => {
            this.emit('remoteStream', streams[0])
        }

        this.mediaDevice = new MediaDevice()

        this.getDescription = this.getDescription.bind(this)
    }

    start(isCaller, config) {
        this.mediaDevice
            .on('stream', (stream) => {
                stream.getTracks().forEach((t) => {
                    this.rtcPeerConnection.addTrack(t, stream)
                })

                this.emit('localStream', stream)

                isCaller
                    ? socket.emit('request', { to: this.remoteId })
                    : this.createOffer()
            })
            .start(config)

        return this
    }

    stop(isCaller) {
        if (isCaller) {
            socket.emit('end', { to: this.remoteId })
        }
        this.mediaDevice.stop()
        this.rtcPeerConnection.restartIce()
        this.off()

        return this
    }

    createOffer() {
        this.rtcPeerConnection.createOffer().then(this.getDescription).catch(console.error)

        return this
    }

    createAnswer() {
        this.rtcPeerConnection.createAnswer().then(this.getDescription).catch(console.error)

        return this
    }

    getDescription(desc) {
        this.rtcPeerConnection.setLocalDescription(desc)

        socket.emit('call', { to: this.remoteId, sdp: desc })

        return this
    }

    setRemoteDescription(desc) {
        this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(desc))

        return this
    }

    addIceCandidate(candidate) {
        if (candidate) {
            this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        }

        return this
    }
}

export default PeerConnection
