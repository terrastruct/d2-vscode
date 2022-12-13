import {
	window,
	ViewColumn,
	WebviewPanel,
} from 'vscode';
import { D2P } from './docToPreviewGenerator';

const preText = String.raw`
<!DOCTYPE html>
<html lang="en" title="d2 Diagram">
<title>Diagram</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta charset="utf-8">

<head>
    <style>
        #toolbar {
            z-index: 100;
            position: fixed;
            left: 0px;
            top: 0px;
            background-color: #909090;
            padding-left: 15px;
            padding-right: 200px;
            padding-bottom: 5px;
            width: 100%;
            color: #0D32B2;
        }

        #zoomSlider {
            appearance: none;
            border-radius: 3px;
            background: #0D32B2;
            height: 5px;
        }

        #zoomSlider::-webkit-slider-thumb {
            appearance: none;
            box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
            border: 1px solid darkblue;
            height: 20px;
            width: 8px;
            margin-bottom: 5px;
            border-radius: 3px;
            background: lightblue;
            cursor: pointer;
        }

        #percent {
            display: inline-block;
            font-family: monospace;
            font-size: 18px;
            font-weight: 600;
            width: 55px;
        }

        button {
            margin-top: 3px;
            color: #0D32B2;
            border-color: #0D32B2;
            background-color: #F7F8FE;
            border-radius: 6px;
            border: 3 3 3 3;
            box-shadow: 1px 1px 1px black, 0px 0px 1px 0d0d0d;
            padding: 5px;
            min-width: 50px;
            font-size: 14px;
            font-weight: 600;
        }

        svg {
            position: absolute;
            left: 0px;
            top: 0px;
            transform-origin: 0px 0px;
            margin-top: 30px;
        }
    </style>
    <div id="toolbar">
        <button onclick="zoomMinus();" title="Zoom Out">Out</button>
        <input id="zoomSlider" title="Zoom" onchange="sliderOnChange()" type="range" min="10" max="150" value="100"
            step="5">
        <button onclick="zoomPlus();" title="Zoom In">In</button>
        <span id="percent"></span>
        <button id="zoomFit" onclick="zoomFit()" title="Fit to window">Fit to window</button>
    </div>
    <script>
		var svg = undefined;
        var zoomLevel = 100;
        var percent = document.getElementById('percent');
        var zoomSlider = document.getElementById('zoomSlider');
        var fitmode = false;

        window.addEventListener("DOMContentLoaded", () => {
            init(1000);
        });

        document.onreadystatechange = () => {
            console.log('DocState: ' + document.readyState);
          };

        function zoomPlus() {
            zoomLevel = Math.min(150, zoomLevel + 5);
            setZoomLevel(zoomLevel);
        }

        function zoomMinus() {
            zoomLevel = Math.max(10, zoomLevel - 5);
            setZoomLevel(zoomLevel);
        }

        function zoomFit() {
            setZoomLevel(100);
            svg.style.height = "100%";
            svg.style.width = "100%";
            setZoomText(false)

            fitmode = true;
        }

        function setZoomLevel(zl) {
            svg.style.height = "";
            svg.style.width = "";
            svg.style.zoom = zl / 100.0;
            setZoomText(true);
            zoomSlider.value = zl;
            console.log('ZoomLevel set: ' + zoomLevel);

            fitmode = false;
        }

        function getSvgElement() {
            var svgs = document.getElementsByTagName('svg');
            return svgs[0];
        }

        function sliderOnChange() { setZoomLevel(zoomSlider.value); }
        
        function setZoomText(text) {
            if (text === true) {
                percent.innerText = (svg.style.zoom * 100.0).toFixed() + "%";
            }
            else {
                percent.innerText = "Fit";
            }
        }

        // WebSocket functionality
        //
        function init(reconnectDelay) {
            const d2ErrDiv = window.document.querySelector("#d2-err");
            const d2SVG = window.document.querySelector("#d2-svg");

            const ws = new WebSocket('`;
            
const postText = String.raw`');
            ws.onopen = () => {
                reconnectDelay = 1000;
                console.info("watch websocket opened");
            };

            ws.onmessage = (ev) => {
                const msg = JSON.parse(ev.data);
                console.debug('watch websocket received data: ' + ev);

                if (msg.svg) {
                    // We could turn d2SVG into an actual SVG element and use outerHTML to fully replace it
                    // with the result from the renderer but unfortunately that overwrites the #d2-svg ID.
                    // Even if you add another line to set it afterwards. The parsing/interpretation of outerHTML must be async.
                    //
                    // There's no way around that short of parsing out the top level svg tag in the msg and
                    // setting innerHTML to only the actual svg innards. However then you also need to parse
                    // out the width, height and viewbox out of the top level SVG tag and update those manually.
                    d2SVG.innerHTML = msg.svg;
                    d2ErrDiv.style.display = "none";
                    svg = getSvgElement();

                    if (fitmode === true) {
                         zoomFit();
                    } else { 
                        setZoomLevel(zoomLevel);
                    }
                }
                if (msg.err) {
                    d2ErrDiv.innerText = msg.err;
                    d2ErrDiv.style.display = "block";
                    d2ErrDiv.scrollIntoView();
                }
            };
            ws.onerror = (ev) => {
                console.error("watch websocket connection error", ev);
            };
            ws.onclose = (ev) => {
                console.error('watch websocket closed with code: ' + ev.code +', and reason : ' + ev.reason);
                console.info('reconnecting in ' + reconnectDelay / 1000 + ' seconds');
                setTimeout(() => {
                    if (reconnectDelay < 16000) {
                        reconnectDelay *= 2;
                    }
                    init(reconnectDelay);
                }, reconnectDelay);
            };
        }
    </script>
</head>

<body style="padding-top: 30px">
    <div id="d2-err" style="display: none"></div>
    <div id="d2-svg" onchange="console.log('change');">
    </div>
</body>

</html>
`;

/**
 * BrowswerWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {

	webViewPanel: WebviewPanel;
	trackerObject?: D2P;

	constructor(trkObj: D2P) {

		this.trackerObject = trkObj;

		this.webViewPanel = window.createWebviewPanel('d2Preview', 'D2 Preview', ViewColumn.Beside, {
			enableFindWidget: true,
			enableScripts: true
		});

		this.webViewPanel.onDidDispose(() => {
			if (this.trackerObject) {
				this.trackerObject.outputDoc = undefined;
				this.trackerObject.endProc();
			}
		});

	}

	setWs(ws: string) {
		this.webViewPanel.webview.html = preText + ws + postText;
	}

	dispose(): void {
		this.webViewPanel.dispose();
	}
}