import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { DatePicker, Select, Spin, Card, Row, Col, Empty, Table } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import CountUp from "react-countup";
import { isAuthenticated } from "../../auth";

const { RangePicker } = DatePicker;
const { Option } = Select;

/** The measure options you allow in the backend: */
const measureOptions = [
	{ label: "Order Count", value: "orderCount" },
	{ label: "Total Quantity", value: "totalQuantity" },
	{ label: "Gross Total", value: "grossTotal" },
	{ label: "Net Total", value: "netTotal" },
	{ label: "Gross Margin", value: "grossMargin" },
];

// For display labels throughout charts/tables/tooltips:
const measureLabelMap = {
	orderCount: "Order Count",
	totalQuantity: "Total Quantity",
	grossTotal: "Gross Total",
	netTotal: "Net Total",
	grossMargin: "Gross Margin",
};

// Utility to determine if the measure should be in currency format
const isCurrencyMeasure = (measureType) =>
	["grossTotal", "netTotal", "grossMargin"].includes(measureType);

// Format the y-value for tooltips or table cells
const formatValue = (measureType, val) => {
	if (isCurrencyMeasure(measureType)) {
		// Display as currency with two decimals
		return `$${Number(val).toFixed(2)}`;
	} else {
		// Integers or raw numeric
		return Number(val).toLocaleString();
	}
};

const AdminReports = () => {
	const [loading, setLoading] = useState(false);
	const { user, token } = isAuthenticated();

	// 1) Date range with dayjs: default to current month
	const [dateRange, setDateRange] = useState([
		dayjs().startOf("month"),
		dayjs().endOf("month"),
	]);

	// 2) Measure type
	const [measureType, setMeasureType] = useState("grossTotal");

	// 3) Data from backend
	const [reportData, setReportData] = useState(null);

	// Extract sub-arrays once we have data
	const {
		dayOverDay = [],
		productSummary = [],
		stateSummary = [],
		statusSummary = [],
		scoreboard = [],
	} = reportData || {};

	// Scoreboard is an array with 1 object (if data is found)
	const score =
		scoreboard && scoreboard.length
			? scoreboard[0]
			: {
					totalOrders: 0,
					totalQuantity: 0,
					grossTotal: 0,
					totalExpenses: 0,
					netTotal: 0,
				};

	// 4) Fetch data from server on dateRange or measureType change
	const fetchReport = async () => {
		try {
			setLoading(true);

			// Build query
			const startDate = dateRange[0].format("YYYY-MM-DD");
			const endDate = dateRange[1].format("YYYY-MM-DD");

			/**
			 * Example route: /order-report/report/:userId
			 * Query params: ?startDate=...&endDate=...&measureType=...
			 */
			const res = await axios.get(
				`${process.env.REACT_APP_API_URL}/order-report/report/${user._id}`,
				{
					params: { startDate, endDate, measureType },
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			setReportData(res.data.data);
		} catch (err) {
			console.error("Error fetching admin report:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReport();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dateRange, measureType]);

	// ==================== Shared Chart Settings ====================
	const chartTooltip = {
		y: {
			formatter: (val) => formatValue(measureType, val),
		},
	};

	// We'll display the measure label in chart titles, etc.
	const measureLabel = measureLabelMap[measureType] || measureType;

	// ==================== Day Over Day (Line Chart) ====================
	const dayOverDayChartOptions = {
		chart: {
			id: "dayOverDay",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		xaxis: {
			categories: dayOverDay.map((d) => d._id), // each date as string "YYYY-MM-DD"
		},
		yaxis: {
			labels: {
				formatter: (val) => formatValue(measureType, val),
			},
		},
		stroke: { curve: "smooth" },
		// A goldish color for the line:
		colors: ["#d4af37"],
		dataLabels: { enabled: false },
		title: {
			text: `Day Over Day (${measureLabel})`,
			align: "center",
			style: {
				fontSize: "16px",
			},
		},
		tooltip: chartTooltip,
	};

	const dayOverDayChartSeries = [
		{
			name: measureLabel,
			data: dayOverDay.map((d) => d.measure),
		},
	];

	// ==================== State Summary (Bar) ====================
	const stateLabels = stateSummary.map((s) => s._id || "Unknown");
	const stateValues = stateSummary.map((s) => s.measure);

	const stateChartOptions = {
		chart: {
			id: "stateSummary",
			type: "bar",
			toolbar: { show: false },
		},
		xaxis: {
			categories: stateLabels,
			labels: {
				rotate: -45,
			},
		},
		yaxis: {
			labels: {
				formatter: (val) => formatValue(measureType, val),
			},
		},
		plotOptions: {
			bar: { borderRadius: 4, horizontal: false },
		},
		// A silverish color for the bars:
		colors: ["#b8b8b8"],
		dataLabels: { enabled: false },
		title: {
			text: `State Summary (${measureLabel})`,
			align: "center",
			style: {
				fontSize: "16px",
			},
		},
		tooltip: chartTooltip,
	};

	const stateChartSeries = [
		{
			name: measureLabel,
			data: stateValues,
		},
	];

	// ==================== Status Summary (Pie Chart) ====================
	const statusLabels = statusSummary.map((s) => s._id || "Unknown");
	const statusValues = statusSummary.map((s) => s.measure);

	const statusChartOptions = {
		chart: { type: "pie" },
		labels: statusLabels,
		title: {
			text: `Status Summary (${measureLabel})`,
			align: "center",
			style: { fontSize: "16px" },
		},
		legend: {
			position: "bottom",
		},
		// A mix of gold & silver shades:
		colors: [
			"#d4af37", // gold
			"#c0c0c0", // classic silver
			"#dedede", // lighter silver
			"#b8b8b8", // mid-silver
			"#f2f2f2", // near white
			"#a8a8a8", // darker grey
		],
		tooltip: chartTooltip,
	};

	// ==================== Product Summary (Table) ====================
	// Sort productSummary from greatest to smallest by the chosen measure
	const getProductValue = (p, type) => {
		switch (type) {
			case "grossTotal":
			case "netTotal":
			case "grossMargin":
				return p[type] || 0;
			case "totalQuantity":
				return p.totalQuantity || 0;
			case "orderCount":
			default:
				return p.orderCount || 0;
		}
	};

	const sortedProductSummary = [...productSummary].sort(
		(a, b) => getProductValue(b, measureType) - getProductValue(a, measureType)
	);

	const productTableColumns = [
		{
			title: "Product",
			dataIndex: "_id",
			key: "productName",
		},
		{
			title: measureLabel, // e.g. "Gross Total", "Net Total", etc.
			dataIndex: "measureValue",
			key: "measureValue",
			render: (value) => formatValue(measureType, value),
		},
	];

	const productTableData = sortedProductSummary.map((item) => ({
		key: item._id,
		_id: item._id, // product name
		measureValue: getProductValue(item, measureType),
	}));

	return (
		<AdminReportsWrapper>
			<h1 className='page-title'>Orders Report</h1>

			{/* Controls: Date Range & Measure Type */}
			<ControlsBar>
				<div className='control-item'>
					<label>Date Range:</label>
					<RangePicker
						value={dateRange}
						onChange={(val) => setDateRange(val)}
						allowClear={false}
					/>
				</div>
				<div className='control-item'>
					<label>Measure Type:</label>
					<Select
						value={measureType}
						onChange={(val) => setMeasureType(val)}
						style={{ width: 200 }}
					>
						{measureOptions.map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Select>
				</div>
			</ControlsBar>

			{loading ? (
				<Spin tip='Loading Reports...' size='large' />
			) : !reportData ? (
				<Empty description='No report data yet.' />
			) : (
				<>
					{/* Scoreboard */}
					<ScoreboardWrapper>
						<Row gutter={[15, 15]}>
							<Col xs={24} sm={12} md={6} lg={5}>
								<StyledCard hoverable>
									<h3>Total Orders</h3>
									<p>
										<CountUp
											end={score.totalOrders}
											separator=','
											duration={1}
										/>
									</p>
								</StyledCard>
							</Col>
							<Col xs={24} sm={12} md={6} lg={5}>
								<StyledCard hoverable>
									<h3>Total Quantity</h3>
									<p>
										<CountUp
											end={score.totalQuantity}
											separator=','
											duration={1}
										/>
									</p>
								</StyledCard>
							</Col>
							<Col xs={24} sm={12} md={6} lg={5}>
								<StyledCard hoverable>
									<h3>Gross Total</h3>
									<p>
										$
										<CountUp
											end={score.grossTotal || 0}
											separator=','
											decimals={2}
											duration={1}
										/>
									</p>
								</StyledCard>
							</Col>
							<Col xs={24} sm={12} md={6} lg={5}>
								<StyledCard hoverable>
									<h3>Total Expenses</h3>
									<p>
										$
										<CountUp
											end={score.totalExpenses || 0}
											separator=','
											decimals={2}
											duration={1}
										/>
									</p>
								</StyledCard>
							</Col>
							<Col xs={24} sm={12} md={6} lg={4}>
								<StyledCard hoverable>
									<h3>Net Total</h3>
									<p>
										$
										<CountUp
											end={score.netTotal || 0}
											separator=','
											decimals={2}
											duration={1}
										/>
									</p>
								</StyledCard>
							</Col>
						</Row>
					</ScoreboardWrapper>

					{/* Charts & Table Grid */}
					<ChartGrid>
						{/* Day Over Day (Line) */}
						<div className='chart-box'>
							{dayOverDay && dayOverDay.length ? (
								<Chart
									options={dayOverDayChartOptions}
									series={dayOverDayChartSeries}
									type='line'
									width='700'
									height='400'
								/>
							) : (
								<Empty description='No Day Over Day Data' />
							)}
						</div>

						{/* Product Summary (Table) */}
						<div className='chart-box'>
							{sortedProductSummary && sortedProductSummary.length ? (
								<Table
									columns={productTableColumns}
									dataSource={productTableData}
									pagination={false}
									size='small'
									title={() => `Product Summary (${measureLabel})`}
									style={{
										maxHeight: "500px",
										minHeight: "500px",
										overflowY: "auto",
									}}
								/>
							) : (
								<Empty description='No Product Data' />
							)}
						</div>

						{/* State Summary (Bar) */}
						<div className='chart-box'>
							{stateSummary.length ? (
								<Chart
									options={stateChartOptions}
									series={stateChartSeries}
									type='bar'
									width='600'
									height='500'
								/>
							) : (
								<Empty description='No State Data' />
							)}
						</div>

						{/* Status Summary (Pie) */}
						<div className='chart-box'>
							{statusSummary && statusSummary.length ? (
								<Chart
									options={statusChartOptions}
									series={statusValues}
									type='pie'
									width='600'
									height='500'
								/>
							) : (
								<Empty description='No Status Data' />
							)}
						</div>
					</ChartGrid>
				</>
			)}
		</AdminReportsWrapper>
	);
};

export default AdminReports;

/* ====================== STYLES ====================== */
const AdminReportsWrapper = styled.div`
	/* A soft silverish background */
	background-color: #f2f2f2;
	padding: 20px;
	border-radius: 20px;
	border: 2px solid #dedede;

	.page-title {
		font-size: 1.4rem;
		margin-bottom: 20px;
		color: #333;
		font-weight: bold;
		text-align: center;
	}

	td {
		text-transform: capitalize;
	}
`;

const ControlsBar = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-bottom: 20px;
	gap: 1rem;

	.control-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		label {
			font-weight: 600;
			color: #555;
		}
	}
`;

const ScoreboardWrapper = styled.div`
	margin-bottom: 20px;
`;

const StyledCard = styled(Card)`
	text-align: center;
	/* Subtle silver-gold gradient */
	background: linear-gradient(135deg, #d4af37 30%, #ffffff 120%);
	border-radius: 10px;
	border: 1px solid #ccc;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	h3 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: #333;
	}
	p {
		font-size: 1.8rem; /* Big, appealing numbers */
		font-weight: bold;
		color: #444;
		margin: 0;
	}
`;

const ChartGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 30px;

	.chart-box {
		border: 1px solid #ccc;
		border-radius: 10px;
		padding: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		background: #ffffff;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.ant-table-title {
			font-weight: bold;
			font-size: 1.1rem;
			text-align: center;
			padding: 8px 0;
			background: #d4af37; /* Goldish header for the table */
			color: #fff;
			border-radius: 6px;
			margin-bottom: 10px;
		}
	}

	@media (min-width: 992px) {
		grid-template-columns: 1fr 1fr;
	}
`;
