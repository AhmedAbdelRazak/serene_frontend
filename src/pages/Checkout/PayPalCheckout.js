/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  Wallet + Card Fields (robust)  •  with verbose logging
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
const API = process.env.REACT_APP_API_URL;
const IS_PROD = process.env.NODE_ENV === "production";
const CLIENT_ID = IS_PROD
	? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
	: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

const SDK_COMPONENTS = "buttons,card-fields";
const WALLET_STYLE = { layout: "vertical", label: "paypal" };
const CARD_FALLBACK = { layout: "vertical", label: "pay", height: 45 };

// console.log("[PayPal] env =", IS_PROD ? "LIVE" : "SANDBOX");
// console.log("[PayPal] client‑id =", CLIENT_ID);
/* ------------------------------------------------------------------ */

export default function PayPalCheckout({
	orderData,
	authToken,
	onLoading = () => {},
	onError = () => {},
}) {
	const [clientToken, setClientToken] = useState(null);

	/* 1. get client‑token */
	useEffect(() => {
		let alive = true;
		// console.log("[PayPal] requesting client‑token …");
		axios
			.post(
				`${API}/paypal/client-token`,
				{},
				{
					headers: { Authorization: `Bearer ${authToken}` },
				}
			)
			.then(({ data }) => {
				// console.log("[PayPal] client‑token fetched:", data.clientToken);
				if (alive) setClientToken(data.clientToken);
			})
			.catch((err) => {
				console.error("[PayPal] client‑token error:", err);
				onError("Unable to initialise PayPal");
			});
		return () => {
			alive = false;
		};
	}, [authToken, onError]);

	/* 2. helper */
	const call = useCallback(
		async (method, url, data = {}, withLoader = false) => {
			// eslint-disable-next-line
			const label = `[PayPal‑API] ${method.toUpperCase()} ${url}`;
			// console.log(label, "⇢", data);
			try {
				if (withLoader) onLoading(true);
				const { data: resp } = await axios({
					method,
					url: `${API}${url}`,
					data,
				});
				// console.log(label, "⇠", resp);
				return resp;
			} finally {
				if (withLoader) onLoading(false);
			}
		},
		[onLoading]
	);

	/* 3. order helpers */
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

	/* 4. SDK options */
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

	// console.log("[PayPal] SDK options", sdkOptions);

	return (
		<PayPalScriptProvider
			key={`pp-${IS_PROD ? "live" : "sb"}-${clientToken}`}
			options={sdkOptions}
		>
			<CardFieldsOrFallback
				createOrder={createOrder}
				captureOrder={captureOrder}
				onError={onError}
			/>

			<PayPalButtons
				fundingSource='paypal'
				style={WALLET_STYLE}
				createOrder={createOrder}
				onApprove={({ orderID }) => captureOrder(orderID)}
				onError={(err) => {
					console.error("[PayPal] wallet error:", err);
					onError("PayPal wallet error.");
				}}
			/>
		</PayPalScriptProvider>
	);
}

/* ------------------------------------------------------------------ */
/*  CardFields drop‑in + fallbacks                                    */
/* ------------------------------------------------------------------ */
function CardFieldsOrFallback({ createOrder, captureOrder, onError }) {
	const containerRef = useRef(null);
	const [mode, setMode] = useState("pending"); // pending | cardfields | fallback

	useEffect(() => {
		let destroy;

		const init = async () => {
			const paypal = window.paypal;
			if (!paypal?.CardFields) {
				// console.log("[CardFields] component undefined → fallback");
				return setMode("fallback");
			}

			if (typeof paypal.CardFields.isEligible === "function") {
				const ok = paypal.CardFields.isEligible();
				// console.log("[CardFields] isEligible() →", ok);
				if (!ok) return setMode("fallback");
			} else {
				// console.log(
				// 	"[CardFields] isEligible() not present (old SDK) – attempting render"
				// );
			}

			try {
				const cardFields = await paypal.CardFields({
					style: {
						input: {
							"font-size": "16px",
							"font-family": "Inter",
							color: "#1a202c",
						},
						"::placeholder": { color: "#A0AEC0" },
						valid: { color: "#2f855a" },
						invalid: { color: "#e53e3e" },
					},
					createOrder,
					onApprove: ({ orderID }) => {
						// console.log("[CardFields] onApprove orderID =", orderID);
						captureOrder(orderID);
					},
					onError: (err) => {
						console.error("[CardFields] error:", err);
						setMode("fallback"); // graceful degradation
						onError("Card payment error.");
					},
				});
				destroy = await cardFields.render(containerRef.current);
				// console.log("[CardFields] rendered");
				setMode("cardfields");
			} catch (e) {
				console.error("[CardFields] render() threw:", e);
				setMode("fallback");
			}
		};

		init();
		return () => {
			destroy?.();
		};
	}, [createOrder, captureOrder, onError]);

	if (mode === "fallback") {
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

	/* pending or cardfields */
	return (
		<CardContainer ref={containerRef}>
			{mode === "pending" && <Spin />}
		</CardContainer>
	);
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                            */
/* ------------------------------------------------------------------ */
const CardContainer = styled.div`
	margin: 12px 0; /* spacing above wallet button */
`;
