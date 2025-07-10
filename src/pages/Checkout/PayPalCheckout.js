/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  Wallet + Card Fields (Expanded Checkout) – Jul 2025 • v4
 *******************************************************************/
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spin, Button } from "antd";
import axios from "axios";
import {
	PayPalScriptProvider,
	PayPalButtons,
	usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

/* ---------- 1.  basic config ---------- */
const API = process.env.REACT_APP_API_URL;
const NODE_ENV = (process.env.REACT_APP_NODE_ENV || "").toUpperCase();
const CLIENT_ID =
	NODE_ENV === "PRODUCTION"
		? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
		: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

/* ---------- 2.  tiny helper ---------- */
const api = (method, url, data, token = "") =>
	axios({
		method,
		url: `${API}${url}`,
		data,
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	}).then((r) => r.data);

/* ---------- 3.  Card Fields component ---------- */
// eslint-disable-next-line
function CardFields({ createOrder, captureOrder, onError }) {
	const [{ isResolved }] = usePayPalScriptReducer();

	const name = useRef(null);
	const number = useRef(null);
	const expiry = useRef(null);
	const cvv = useRef(null);

	const [instance, setInstance] = useState(null);
	const [busy, setBusy] = useState(false);

	/* initialise once SDK is ready */
	useEffect(() => {
		if (!isResolved || instance || !window.paypal?.CardFields) return;

		const cf = window.paypal.CardFields({
			createOrder,
			// Handle both `orderID` (new docs) and `orderId` (legacy sample)
			onApprove: (data) => captureOrder(data.orderID || data.orderId),
			onError: (e) => {
				console.error("CardFields SDK error:", e);
				onError("Card payment error.");
			},
			style: {
				input: { "font-size": "16px", color: "#333" },
				".invalid": { color: "red" },
			},
		});
		if (!cf.isEligible()) return;

		cf.NameField().render(name.current);
		cf.NumberField().render(number.current);
		cf.ExpiryField().render(expiry.current);
		cf.CVVField().render(cvv.current);
		setInstance(cf);
	}, [isResolved, instance, createOrder, captureOrder, onError]);

	/* Pay‑now click */
	const payNow = async () => {
		if (!instance) return;
		setBusy(true);
		try {
			await instance.submit({}); /* onApprove will fire */
		} catch (e) {
			console.error(e);
			onError("Card submission failed.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div style={{ marginTop: 24, position: "relative" }}>
			{busy && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(255,255,255,.6)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 5,
					}}
				>
					<Spin />
				</div>
			)}

			<div ref={name} style={{ marginBottom: 8 }} />
			<div ref={number} style={{ marginBottom: 8 }} />
			<div style={{ display: "flex", gap: 8 }}>
				<div ref={expiry} style={{ flex: 1 }} />
				<div ref={cvv} style={{ flex: 1 }} />
			</div>

			<Button
				type='primary'
				block
				style={{ marginTop: 16 }}
				onClick={payNow}
				disabled={!instance || busy}
			>
				Pay now with Card
			</Button>
		</div>
	);
}

/* ---------- 4.  Main exported component ---------- */
export default function PayPalCheckout({
	orderData,
	authToken = "",
	onError = () => {},
}) {
	const [clientToken, setClientToken] = useState(null);
	const [overlay, setOverlay] = useState(false);
	const invoiceRef = useRef(null);

	/* 4.1  fetch JS‑SDK client‑token once */
	useEffect(() => {
		api("post", "/paypal/client-token", {}, authToken)
			.then((d) => setClientToken(d.clientToken))
			.catch((e) => {
				console.error(e);
				onError("Init PayPal failed.");
			});
	}, [authToken, onError]);

	/* 4.2  helpers shared by wallet & card */
	const createOrder = useCallback(async () => {
		setOverlay(true);
		try {
			const { paypalOrderId, provisionalInvoice } = await api(
				"post",
				"/paypal/create-order",
				{ orderData },
				authToken
			);
			console.log("🟢 create‑order →", paypalOrderId);
			invoiceRef.current = provisionalInvoice;
			return paypalOrderId;
		} finally {
			setOverlay(false);
		}
	}, [orderData, authToken]);

	const captureOrder = useCallback(
		async (paypalOrderId) => {
			setOverlay(true);
			try {
				console.log("🔵 capture‑order →", paypalOrderId);
				await api(
					"post",
					"/paypal/capture-order",
					{
						paypalOrderId,
						orderData,
						provisionalInvoice: invoiceRef.current,
					},
					authToken
				);
				window.location.href = "/dashboard";
			} catch (e) {
				console.error("capture‑order error:", e?.response?.data || e);
				onError("Payment could not be completed.");
			} finally {
				setOverlay(false);
			}
		},
		[orderData, authToken, onError]
	);

	/* 4.3  loading state */
	if (!clientToken) return <Spin />;

	/* 4.4  render */
	return (
		<div style={{ position: "relative" }}>
			{overlay && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(255,255,255,.6)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 10,
					}}
				>
					<Spin />
				</div>
			)}

			<PayPalScriptProvider
				options={{
					"client-id": CLIENT_ID,
					"data-client-token": clientToken,
					components: "buttons,card-fields",
					currency: "USD",
					intent: "capture",
					"enable-funding": "card,paypal,venmo,paylater",
				}}
			>
				{/* Wallet / Venmo / Pay Later */}
				<PayPalButtons
					fundingSource='paypal'
					style={{ layout: "vertical", label: "paypal" }}
					createOrder={createOrder}
					onApprove={({ orderID, orderId }) => captureOrder(orderID || orderId)}
					onError={(e) => {
						console.error("wallet error:", e);
						onError("PayPal wallet error.");
					}}
				/>

				{/* Inline card checkout */}
				{/* <CardFields
					createOrder={createOrder}
					captureOrder={captureOrder}
					onError={onError}
				/> */}
			</PayPalScriptProvider>
		</div>
	);
}
