addEventListener('fetch', event => {
  event.respondWith(fetchAndStream(event.request))
})

async function fetchAndStream(request) {
  const url = new URL(request.url)
  let req_range = request.headers.get('range')
  let req_headers = new Headers();
  let req_rangenum = 0
  if(req_range != null && req_range !='bytes=0-1'){
    var reg = /\=([0-9]\d*)\-/g
    var therange = req_range.match(reg)
    req_rangenum = parseInt(therange[0].replace('=','').replace('-',''))
    req_headers.append('range', req_range);
  }
  if(req_range =='bytes=0-1'){ //兼容苹果手机
    req_headers.append('range', 'bytes=0-1');
  }
  //console.log(req_rangenum)
  var req_init = {headers: req_headers};

  if(url.pathname == '\/mp4'){
    let params = url.searchParams;
    let theurl = atob(params.get("url"));
    var urlpart = theurl.split('//');
    // Fetch from origin server.
    let response = await fetch('http://91video.919191.pl/'+urlpart[2], req_init)
    const { headers } = response
    const contentLength = headers.get('content-length')    
    const contentRange = headers.get('content-range')
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'video/mp4');    
    myHeaders.append('Access-Control-Allow-Origin', '*');
    if(contentRange){ //兼容苹果手机
      myHeaders.append('Content-Range', contentRange)
    }else{
      myHeaders.append('Content-Range', 'bytes '+ req_rangenum +'-'+ (parseInt(req_rangenum) + parseInt(contentLength-1)) + '/' + (parseInt(req_rangenum) + parseInt(contentLength)))
    }
    var init = {"status":206,"statusText":"Partial Content",headers: myHeaders};
    
    let { readable, writable } = new TransformStream()

    let res = new Response(readable, init)

    response.body.pipeTo(writable)

    return res
  }
  return new Response('Method not allowed', { status: 405 })
}
