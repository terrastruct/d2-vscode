import { readFileSync } from 'fs';
import * as path from 'path';
import {
    Uri,
    ViewColumn,
    WebviewPanel,
    window} from 'vscode';

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
		var svgElement;
		var zoomLevel = 100;
		var percent = document.getElementById('percent');
		var zoomSlider = document.getElementById('zoomSlider');

		function onLoad() {
			var svgs = document.getElementsByTagName('svg');
			svgElement = svgs[0];
			svgElement.style.marginTop = "30px";
			setZoomLevel(100);
			setZoomText(true);
		}
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
			svgElement.style.height = "100%";
			svgElement.style.width = "100%";
			setZoomText(false)
		}
		function setZoomLevel(zl) {
			svgElement.style.height = "";
			svgElement.style.width = "";

			svgElement.style.zoom = zl / 100.0;
			setZoomText(true);

			zoomSlider.value = zl;
		}
		function sliderOnChange() { setZoomLevel(zoomSlider.value); }
		function setZoomText(text) {

			if (text === true) {
				percent.innerText = (svgElement.style.zoom * 100.0).toFixed() + "%";
			}
			else {
				percent.innerText = "Fit";
			}
		}
	</script>

</head>

<body onload="onLoad();">
`;

//const svgText = String.raw`
//<svg width="500" height="350">
//<rect x="100" y="100" width="300" height="150" fill="yellow" stroke="black" stroke-width="5" />
//</svg>`;

const postText = String.raw`<body><html>`;
/**
 * BrowserWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {

    webViewPanel: WebviewPanel;
    trackerObject?: D2P;

    constructor(trkObj: D2P) {

        this.trackerObject = trkObj;

        this.webViewPanel = window.createWebviewPanel('d2Preview', 'D2 Preview', 
            ViewColumn.Beside, {
            enableFindWidget: true,
            enableScripts: true,
            localResourceRoots: [Uri.file(path.join(extContext.extensionPath, 'pages'))]
            });

        const onDiskPath = path.join(extContext.extensionPath, 'pages/previewPage.html');
        let data: Buffer = Buffer.alloc(1);
        data = readFileSync(onDiskPath);

        this.webViewPanel.webview.html = data.toString();

        this.webViewPanel.onDidDispose(() => {
            if (this.trackerObject) {
                this.trackerObject.outputDoc = undefined;
            }
        });

    }

    setSvg(svg: string): void {

        this.webViewPanel.webview.postMessage({command: 'render', data: svg});
    }

    dispose(): void {
        this.webViewPanel.dispose();
    }
}
    dispose(): void {
        this.webViewPanel.dispose();
    }
}