import asyncio
import websockets
import json

async def test_audio_ws():
    uri = "ws://127.0.0.1:8000/detect/audio"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to Audio WebSocket")
            # Send small dummy byte chunk
            dummy_data = b"\x00" * 100
            await websocket.send(dummy_data)
            print("Sent dummy data")
            
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_audio_ws())
