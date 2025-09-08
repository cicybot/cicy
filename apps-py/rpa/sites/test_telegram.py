import unittest
from urllib.parse import unquote
import json

import requests

from browser import Browser


def decode_video_src(encoded_string):

    decoded_string = unquote(encoded_string)
    print(decoded_string)
    json_string = decoded_string.replace('stream/', '')
    data_dict = json.loads(json_string)
    return data_dict
class TestTelegram(unittest.IsolatedAsyncioTestCase):
    def test_curl(self):

        url = 'https://web.telegram.org/k/stream/%7B%22dcId%22%3A5%2C%22location%22%3A%7B%22_%22%3A%22inputDocumentFileLocation%22%2C%22id%22%3A%226255955629987332552%22%2C%22access_hash%22%3A%228362935343079637593%22%2C%22file_reference%22%3A%5B5%2C0%2C0%2C0%2C0%2C166%2C144%2C30%2C46%2C0%2C0%2C5%2C228%2C104%2C170%2C239%2C34%2C167%2C180%2C42%2C136%2C245%2C77%2C193%2C136%2C74%2C17%2C246%2C186%2C99%2C202%2C11%2C21%5D%7D%2C%22size%22%3A156310635%2C%22mimeType%22%3A%22video%2Fmp4%22%2C%22fileName%22%3A%22%E7%BB%85%E5%A3%AB%E7%A6%8F%E5%88%A9%E7%94%B5%E6%8A%A5%E6%90%9C%40HTPORN.mp4%22%7D'

        headers = {
            'Range': 'bytes=0-',
            'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'Referer': 'https://web.telegram.org/k/'
        }

        response = requests.get(url, headers=headers)

        if response.status_code == 206:  # 206 Partial Content
            # Process the response content
            content = response.content
            print(f"Received {len(content)} bytes")
            # You can save it to a file or process further
            # with open('video_part.mp4', 'wb') as f:
            #     f.write(content)
        else:
            print(f"Request failed with status code: {response.status_code}")
            print(response.text)
    async def test_get_web_contents_id(self):
        browser = Browser("https://web.telegram.org/k")
        web_content_id = browser.get_web_contents_id()
        print("web_content_id:",web_content_id)
        self.assertTrue(web_content_id > 0,True)
    async def test_video(self):
        browser = Browser("https://web.telegram.org/k")
        browser.get_web_contents_id()
        res = browser.exec_js("""
        if(document.querySelector('.ckin__video')){
            const src = document.querySelector('.ckin__video').src;
            return src
        }else{
            return null
        }
        """)
        data = decode_video_src(res['result'])
        print(data['location'])
        id = data['location']["id"]
        size = data["size"]
        mime_type = data["mimeType"]
        file_name = data["fileName"]
        print(id,size,mime_type,file_name)

    async def test_video_data(self):
        browser = Browser("https://web.telegram.org/k")
        browser.get_web_contents_id()

        res = browser.exec_js("""
        
        async function mergeCachedStreamChunks(cacheName, baseUrl, totalSize) {
            try {
                const cache = await caches.open(cacheName);
                const allRequests = await cache.keys();
                
                // Filter requests for this specific stream
                const regex = new RegExp(baseUrl, 'i');
                const matchingRequests = allRequests.filter(request => regex.test(request.url));
                
                // Sort requests by offset to ensure correct order
                const sortedRequests = matchingRequests.sort((a, b) => {
                    const getOffset = url => {
                        const match = url.match(/offset=(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };
                    return getOffset(a.url) - getOffset(b.url);
                });
        
                console.log('Sorted requests:', sortedRequests.map(r => r.url));
        
                // Create an array to hold all the chunks as ArrayBuffers
                const chunks = [];
        
                // Fetch each chunk in order
                for (const request of sortedRequests) {
                    const response = await cache.match(request);
                    if (response && response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        chunks.push(arrayBuffer);
                        console.log(`Fetched chunk: ${request.url}, size: ${arrayBuffer.byteLength}`);
                    }
                }
        
                // Calculate total size from all chunks
                const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
                console.log(`Total chunks: ${chunks.length}, Total bytes: ${totalBytes}`);
        
                // Merge all chunks into a single ArrayBuffer
                const mergedArrayBuffer = new ArrayBuffer(totalBytes);
                const mergedView = new Uint8Array(mergedArrayBuffer);
                
                let offset = 0;
                for (const chunk of chunks) {
                    const chunkView = new Uint8Array(chunk);
                    mergedView.set(chunkView, offset);
                    offset += chunk.byteLength;
                }
        
                // Create the final Blob
                const mergedBlob = new Blob([mergedArrayBuffer], {
                    type: 'application/octet-stream'
                });
        
                console.log('Final blob created:', {
                    size: mergedBlob.size,
                    type: mergedBlob.type,
                    expectedSize: totalSize
                });
        
                return mergedBlob;
        
            } catch (error) {
                console.error('Error merging cached chunks:', error);
                throw error;
            }
        }
        
        // Usage
        const size = 6115400;
        const baseUrl = '6194784944821110170';
        
        const mergedBlob = await mergeCachedStreamChunks('cachedStreamChunks', baseUrl, size)
        console.log('Successfully merged blob:', mergedBlob);
                
        const downloadUrl = URL.createObjectURL(mergedBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.textContent = "down"
        link.download =  `downloaded-file-${baseUrl}.mp4`;
        link.style.position = 'fixed';
        link.style.top = '0px';
        link.style.zIndex = '1111111';
        document.body.appendChild(link);
        return downloadUrl;
        """)
        print(res)


if __name__ == '__main__':
    unittest.main()
