import React, { useEffect, useState, useCallback } from "react";
import { Spin } from "antd";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalCheckout = ({
	orderData,
	authToken,
	onLoading,
	onSuccess,
	onError,
}) => {
	const [clientToken, setClientToken] = useState(null);

	// Decide which ID to show to the SDK based on env
	const clientId =
		process.env.REACT_APP_NODE_ENV?.toUpperCase() === "PRODUCTION"
			? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
			: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

	/** Step 1: get client‑token (required for card fields) */
	useEffect(() => {
		let isMounted = true;
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/paypal/client-token`,
				{},
				{
					headers: { Authorization: `Bearer ${authToken}` },
				}
			)
			.then((r) => isMounted && setClientToken(r.data.clientToken))
			.catch((e) => {
				console.error("client‑token error:", e);
				onError("Unable to initialise PayPal");
			});
		return () => (isMounted = false);
	}, [authToken, onError]);

	/** Small helper – wrap axios calls with loading toggles */
	const call = useCallback(
		async (method, url, data = {}) => {
			try {
				// onLoading(true);
				const { data: resp } = await axios({
					method,
					url: `${process.env.REACT_APP_API_URL}${url}`,
					data,
					// headers: { Authorization: `Bearer ${authToken}` },
				});
				return resp;
			} catch (err) {
				console.error(err);
				throw err?.response?.data?.error || "Payment error";
			} finally {
				// onLoading(false);
			}
		},
		// eslint-disable-next-line
		[authToken, onLoading]
	);

	if (!clientToken) return <Spin />;

	return (
		<PayPalScriptProvider
			options={{
				"client-id": clientId,
				"data-client-token": clientToken,
				currency: "USD",
				intent: "capture",
				components: "buttons",
				"enable-funding": "card,paypal",
			}}
		>
			{/* ① PayPal wallet / Venmo / Pay Later  */}
			<PayPalButtons
				fundingSource='paypal'
				style={{ layout: "vertical", label: "paypal" }}
				createOrder={() =>
					call("post", "/paypal/create-order", { orderData }).then(
						(r) => r.paypalOrderId
					)
				}
				onApprove={(data) =>
					call("post", "/paypal/capture-order", { paypalOrderId: data.orderID })
						.then(
							() =>
								(window.location.href = "https://serenejannat.com/dashboard")
						)
						.catch(onError)
				}
				onError={onError}
			/>

			{/* ② Card‑only – no redirect, PayPal renders hosted fields inline */}
			<PayPalButtons
				fundingSource='card'
				style={{ layout: "vertical", label: "pay" }} // PayPal shows card fields
				createOrder={() =>
					call("post", "/paypal/create-order", { orderData }).then(
						(r) => r.paypalOrderId
					)
				}
				onApprove={(data) =>
					call("post", "/paypal/capture-order", { paypalOrderId: data.orderID })
						.then(
							() =>
								(window.location.href = "https://serenejannat.com/dashboard")
						)
						.catch(onError)
				}
				onError={onError}
			/>
		</PayPalScriptProvider>
	);
};

export default PayPalCheckout;
