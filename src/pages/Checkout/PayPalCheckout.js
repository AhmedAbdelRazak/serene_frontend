/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  Wallet  +  Card Fields drop‑in  •  July 2025
 *******************************************************************/
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import styled from "styled-components";
import { Spin } from "antd";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                         */
/* ------------------------------------------------------------------ */
const API = process.env.REACT_APP_API_URL;
const IS_PROD = process.env.NODE_ENV === "production";
const CLIENT_ID = IS_PROD
	? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
	: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

const SDK_COMPONENTS = "buttons,card-fields"; // 👈 Card Fields enabled
const WALLET_STYLE = { layout: "vertical", label: "paypal" };
const CARD_FALLBACK = { layout: "vertical", label: "pay", height: 45 };
/* ------------------------------------------------------------------ */

export default function PayPalCheckout({
	orderData,
	authToken,
	onLoading = () => {},
	onError = () => {},
}) {
	const [clientToken, setClientToken] = useState(null);

	/* 1. fetch JS‑SDK client token */
	useEffect(() => {
		let alive = true;
		axios
			.post(
				`${API}/paypal/client-token`,
				{},
				{
					headers: { Authorization: `Bearer ${authToken}` },
				}
			)
			.then(({ data }) => alive && setClientToken(data.clientToken))
			.catch((err) => {
				console.error(err);
				onError("Unable to initialise PayPal");
			});
		return () => {
			alive = false;
		};
	}, [authToken, onError]);

	/* 2. axios helper (loader only on capture) */
	const call = useCallback(
		async (method, url, data = {}, withLoader = false) => {
			try {
				if (withLoader) onLoading(true);
				const { data: resp } = await axios({
					method,
					url: `${API}${url}`,
					data,
				});
				return resp;
			} finally {
				if (withLoader) onLoading(false);
			}
		},
		[onLoading]
	);

	/* 3. create / capture helpers */
	const invoiceRef = useRef(null);

	const createOrder = useCallback(
		() =>
			call("post", "/paypal/create-order", { orderData }).then(
				({ paypalOrderId, provisionalInvoice }) => {
					invoiceRef.current = provisionalInvoice;
					return paypalOrderId;
				}
			),
		[call, orderData]
	);

	const captureOrder = useCallback(
		(orderID) =>
			call(
				"post",
				"/paypal/capture-order",
				{
					paypalOrderId: orderID,
					orderData,
					provisionalInvoice: invoiceRef.current,
				},
				true
			)
				.then(() => (window.location.href = "/dashboard"))
				.catch(() => onError("Payment could not be completed.")),
		[call, onError, orderData]
	);

	/* 4. SDK options (always at top level) */
	const sdkOptions = useMemo(
		() =>
			clientToken && {
				"client-id": CLIENT_ID,
				"data-client-token": clientToken,
				dataClientToken: clientToken,
				currency: "USD",
				intent: "capture",
				components: SDK_COMPONENTS,
				"enable-funding": "paypal,card",
				commit: "true",
			},
		[clientToken]
	);

	if (!sdkOptions) return <Spin />;

	return (
		<PayPalScriptProvider
			key={`pp-${IS_PROD ? "live" : "sb"}-${clientToken}`}
			options={sdkOptions}
		>
			{/* Card Fields drop‑in (or fallback Smart Button) */}
			<CardFieldsOrFallback
				createOrder={createOrder}
				captureOrder={captureOrder}
				onError={onError}
			/>

			{/* Wallet / Pay Later / Venmo */}
			<PayPalButtons
				fundingSource='paypal'
				style={WALLET_STYLE}
				createOrder={createOrder}
				onApprove={({ orderID }) => captureOrder(orderID)}
				onError={(err) => {
					console.error(err);
					onError("PayPal wallet error.");
				}}
			/>
		</PayPalScriptProvider>
	);
}

/* ------------------------------------------------------------------ */
/*  CardFields drop‑in                                                */
/* ------------------------------------------------------------------ */
function CardFieldsOrFallback({ createOrder, captureOrder, onError }) {
	const containerRef = useRef(null);
	const [ready, setReady] = useState(false);
	const [failed, setFailed] = useState(false);

	/* try to render Card Fields once */
	useEffect(() => {
		let destroy;
		(async () => {
			if (!window.paypal?.CardFields || !containerRef.current)
				return setFailed(true);

			try {
				const cardFields = await window.paypal.CardFields({
					style: {
						/* optional styling */
						input: {
							color: "#1a202c",
							"font-size": "16px",
							"font-family": "Inter",
						},
						":focus": { color: "#000" },
						valid: { color: "#2f855a" },
						invalid: { color: "#e53e3e" },
					},
					createOrder,
					onApprove: ({ orderID }) => captureOrder(orderID),
					onError: (err) => {
						console.error(err);
						setFailed(true);
						onError("Card payment error.");
					},
				});
				destroy = await cardFields.render(containerRef.current);
				setReady(true);
			} catch (e) {
				console.error("CardFields error:", e);
				setFailed(true);
			}
		})();
		return () => {
			destroy?.();
		};
	}, [createOrder, captureOrder, onError]);

	if (failed) {
		/* Fallback: show standard Card Smart Button */
		return (
			<PayPalButtons
				fundingSource='card'
				style={CARD_FALLBACK}
				createOrder={createOrder}
				onApprove={({ orderID }) => captureOrder(orderID)}
				onError={() => onError("Card payment error.")}
			/>
		);
	}

	return <CardContainer ref={containerRef}>{!ready && <Spin />}</CardContainer>;
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                            */
/* ------------------------------------------------------------------ */
const CardContainer = styled.div`
	margin: 12px 0; /* gap above PayPal wallet button */
`;
