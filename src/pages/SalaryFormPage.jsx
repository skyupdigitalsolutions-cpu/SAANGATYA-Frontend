// src/pages/SalaryFormPage.jsx

import { useState, useEffect, useRef } from "react";
import saangatyaLogo from "../assets/image1.png";
import { useFormik } from "formik";
import * as Yup from "yup";

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("admin_token");
const getAdmin = () => JSON.parse(localStorage.getItem("admin_info") || "null");
const clearAuth = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_info");
};

const authFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    return null;
  }
  return res;
};

const logout = async () => {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
  }
  clearAuth();
  window.location.href = "/login";
};

// ─── REAL BACKEND API ──────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "";

async function fetchEmployee(id) {
  if (!id || id.trim().length < 3) return null;
  try {
    const res = await authFetch(
      `${API_BASE}/api/employees/${id.trim().toUpperCase()}`,
    );
    if (!res || res.status === 404) return null;
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("[fetchEmployee]", err);
    return null;
  }
}

async function saveEmployee(id, data) {
  const res = await authFetch(`${API_BASE}/api/employees`, {
    method: "POST",
    body: JSON.stringify({ ...data, employeeId: id.trim().toUpperCase() }),
  });
  if (!res) return false;
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to save employee");
  return true;
}

async function updateEmployee(id, data) {
  const res = await authFetch(
    `${API_BASE}/api/employees/${id.trim().toUpperCase()}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  if (!res) return false;
  const json = await res.json();
  if (!json.success)
    throw new Error(json.message || "Failed to update employee");
  return true;
}

async function sendSalaryToBackend(formData, isNewJoinee) {
  const res = await authFetch(`${API_BASE}/api/salary/send`, {
    method: "POST",
    body: JSON.stringify({ ...formData, isNewJoinee }),
  });
  if (!res) return { emailSent: false, emailError: "Auth error" };
  return res.json();
}

async function checkEmployeeExists(id) {
  try {
    const res = await authFetch(
      `${API_BASE}/api/employees/${id.trim().toUpperCase()}`,
    );
    return res && res.ok;
  } catch {
    return false;
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
// FIX 1: renamed param to inputNum, round to whole number inside
const numberToWords = (inputNum) => {
  const num = Math.round(inputNum);
  if (!num || num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const sub = (n) => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + sub(n % 100) : "")
    );
  };
  const cr = Math.floor(num / 10000000),
    lk = Math.floor((num % 10000000) / 100000);
  const th = Math.floor((num % 100000) / 1000),
    rm = num % 1000;
  return [
    cr && sub(cr) + " Crore",
    lk && sub(lk) + " Lakh",
    th && sub(th) + " Thousand",
    rm && sub(rm),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

// ─── VALIDATION ────────────────────────────────────────────────────────────
const validationSchema = Yup.object({
  employeeId: Yup.string().required("Employee ID is required"),
  employeeName: Yup.string().required("Employee Name is required"),
  designation: Yup.string().required("Designation is required"),
  department: Yup.string().required("Department is required"),
  dateOfJoining: Yup.string().required("Date of Joining is required"),
  payMonth: Yup.string().required("Pay Month is required"),
  bankName: Yup.string().required("Bank Name is required"),
  bankAcNo: Yup.string().required("Bank A/C No is required"),
  email: Yup.string().email("Invalid email address").nullable(),
  payDays: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Total Days in Month is required"),
  lopDays: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("LOP Days is required"),
  basicSalary: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Basic Salary is required"),
  incentivePay: Yup.number().typeError("Must be a number"),
  travelAllowance: Yup.number().typeError("Must be a number"),
  professionalTax: Yup.number().typeError("Must be a number").min(0),
  transactionId: Yup.string().nullable(),
  lossOfPay: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Required"),
});

const defaultValues = {
  employeeId: "",
  employeeName: "",
  designation: "",
  department: "",
  dateOfJoining: "",
  payMonth: "",
  bankName: "",
  bankAcNo: "",
  email: "",
  payDays: "",
  lopDays: "0",
  basicSalary: "",
  incentivePay: "",
  travelAllowance: "",
  professionalTax: "",
  transactionId: "",
  lossOfPay: "",
};

// ─── SLIP CONTENT ─────────────────────────────────────────────────────────
function SlipContent({ values, isNewJoinee }) {
  const earn =
    Math.round(Number(values.basicSalary) || 0) +
    Math.round(Number(values.incentivePay) || 0) +
    Math.round(Number(values.travelAllowance) || 0);
  const ded = Math.round(Number(values.lossOfPay) || 0) + Math.round(Number(values.professionalTax) || 0);
  const net = earn - ded;

  const fmt = (n) => Math.round(Number(n || 0)).toLocaleString("en-IN");

  const payMonthLabel = values.payMonth
    ? new Date(values.payMonth + "-01").toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }).toUpperCase()
    : "—";

  const doj = values.dateOfJoining
    ? new Date(values.dateOfJoining).toLocaleDateString("en-IN")
    : "—";

  const lc = {
    border: "1px solid #ccc",
    padding: "8px 12px",
    fontSize: "12px",
    background: "#f5f5f5",
    color: "#333",
    fontWeight: "600",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    verticalAlign: "middle",
    fontFamily: "Arial, sans-serif",
  };

  const vc = {
    border: "1px solid #ccc",
    padding: "8px 12px",
    fontSize: "13px",
    background: "#ffffff",
    color: "#111",
    fontWeight: "400",
    verticalAlign: "middle",
    fontFamily: "Arial, sans-serif",
  };

  const hc = {
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    background: "#f0f0f0",
    color: "#111",
    border: "1px solid #ccc",
    fontFamily: "Arial, sans-serif",
    verticalAlign: "middle",
    textAlign: "center",
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "40px 48px",
        fontFamily: "Arial, sans-serif",
        color: "#111",
        width: "794px",
        height: "1123px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header: Logo left, Address right ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <img
          src={saangatyaLogo}
          alt="SAANGATYA Logo"
          style={{ width: "160px", height: "auto", objectFit: "contain", display: "block" }}
        />
        <div style={{ textAlign: "right", fontSize: "12px", color: "#444", lineHeight: "1.7", maxWidth: "260px", paddingTop: "8px" }}>
          #11/A, Top Floor, 1st Main, Near KEB Quarters,<br />
          2nd Block, Thyagaraja Nagar,<br />
          Bengaluru-560028
        </div>
      </div>

      {/* ── Title ── */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <span style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          fontWeight: "800",
          letterSpacing: "5px",
          color: "#B43C28",
          textTransform: "uppercase",
        }}>
          SALARY SLIP — {payMonthLabel}
        </span>
      </div>

      {/* ── Employee Info Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "26%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={lc}>EMPLOYEE NAME</td>
            <td style={vc}>{values.employeeName || "—"}</td>
            <td style={lc}>BANK NAME</td>
            <td style={vc}>{values.bankName || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>EMPLOYEE ID</td>
            <td style={vc}>{values.employeeId || "—"}</td>
            <td style={lc}>BANK A/C NO</td>
            <td style={vc}>{values.bankAcNo || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>DESIGNATION</td>
            <td style={vc}>{values.designation || "—"}</td>
            <td style={lc}>TOTAL DAYS IN MONTH</td>
            <td style={vc}>{values.payDays || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>DEPARTMENT</td>
            <td style={vc}>{values.department || "—"}</td>
            <td style={lc}>LOP DAYS</td>
            <td style={vc}>{values.lopDays || "0"}</td>
          </tr>
          <tr>
            <td style={lc}>DATE OF JOINING</td>
            <td style={vc}>{doj}</td>
            <td style={lc}>TRANSACTION ID</td>
            <td style={{ ...vc, fontFamily: "monospace", fontSize: "12px", letterSpacing: "0.4px" }}>
              {values.transactionId || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Earnings / Deductions Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <colgroup>
          <col style={{ width: "38%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={hc}>EARNINGS</th>
            <th style={hc}>AMOUNT</th>
            <th style={hc}>DEDUCTION</th>
            <th style={hc}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Basic Salary</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(values.basicSalary)}</td>
            <td style={{ ...vc, textAlign: "left" }}>Loss of Pay</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(values.lossOfPay)}</td>
          </tr>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Incentive Pay</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(values.incentivePay)}</td>
            <td style={{ ...vc, textAlign: "left" }}>Professional Tax</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(values.professionalTax)}</td>
          </tr>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Travel Allowance</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(values.travelAllowance)}</td>
            <td style={vc} />
            <td style={vc} />
          </tr>
          <tr>
            <td style={{ ...vc, padding: "18px 12px" }} />
            <td style={{ ...vc, padding: "18px 12px" }} />
            <td style={vc} />
            <td style={vc} />
          </tr>
          <tr>
            <td style={{ ...vc, fontWeight: "700", textAlign: "left" }}>TOTAL EARNINGS</td>
            <td style={{ ...vc, fontWeight: "700", textAlign: "right" }}>{fmt(earn)}</td>
            <td style={{ ...vc, fontWeight: "700", textAlign: "left" }}>TOTAL DEDUCTION</td>
            <td style={{ ...vc, fontWeight: "700", textAlign: "right" }}>{fmt(ded)}</td>
          </tr>
          <tr>
            <td colSpan="2" style={{ border: "none", background: "transparent" }} />
            <td style={{
              border: "1px solid #ccc",
              padding: "10px 12px",
              fontSize: "14px",
              fontWeight: "700",
              background: "#f5f5f5",
              textAlign: "left",
              fontFamily: "Arial, sans-serif",
            }}>
              TOTAL SALARY
            </td>
            <td style={{
              border: "1px solid #ccc",
              padding: "10px 12px",
              fontSize: "14px",
              fontWeight: "700",
              background: "#f5f5f5",
              textAlign: "right",
              fontFamily: "Arial, sans-serif",
            }}>
              {fmt(net)}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "8px" }}>
        {/* Left — Contact Details */}
        <div style={{ width: "45%" }}>
          <div style={{ fontWeight: "700", fontSize: "13px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#111", marginBottom: "6px" }}>
            CONTACT DETAILS
          </div>
          <div style={{ lineHeight: "1.9", color: "#444", fontSize: "13px" }}>
            <span>Mobile — +91 9538752960</span><br />
            <span>Email - contact@saangathya.in</span>
          </div>
        </div>

        {/* Right — Thank You + Signature */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#111", marginBottom: "10px", letterSpacing: "0.5px" }}>
            Thank You
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#B43C28", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
              FOR SAANGATYA PROPERTIES AND DEVELOPERS
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "55px", marginBottom: "2px" }}>
              <img
                src="/sign.webp"
                alt="Signature"
                style={{ maxHeight: "48px", maxWidth: "160px", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
            <div style={{ borderTop: "1px solid #aaa", width: "180px", margin: "0 auto 5px auto" }} />
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: "#333" }}>
              MANAGING DIRECTOR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function SalaryFormPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const [isNewJoinee, setIsNewJoinee] = useState(false);
  const [isNewJoineeViaModal, setIsNewJoineeViaModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toast, setToast] = useState(null);
  const [showNewEmpModal, setShowNewEmpModal] = useState(false);
  const [newEmpIdInput, setNewEmpIdInput] = useState("");
  const [newEmpIdError, setNewEmpIdError] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── View Receipts state ──
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState(null); // record being previewed
  const [downloadingId, setDownloadingId] = useState(null); // _id of record being downloaded
  const receiptSlipRef = useRef(null);

  const receiptRef = useRef(null);
  const previewRef = useRef(null);
  const newEmpIdRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setAdminInfo(data.admin);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        clearAuth();
        window.location.href = "/login";
      });
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formik = useFormik({
    initialValues: defaultValues,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
  });

  useEffect(() => {
    const id = formik.values.employeeId?.trim();
    if (!id || id.length < 3) {
      setFetchStatus("idle");
      setIsNewJoinee(false);
      setIsNewJoineeViaModal(false);
      setIsEditMode(false);
      [
        "employeeName",
        "designation",
        "department",
        "dateOfJoining",
        "bankName",
        "bankAcNo",
        "email",
      ].forEach((k) => formik.setFieldValue(k, "", false));
      return;
    }
    if (isNewJoineeViaModal) return;
    setFetchStatus("loading");
    setIsEditMode(false);
    let cancelled = false;
    fetchEmployee(id).then((emp) => {
      if (cancelled) return;
      if (emp) {
        Object.entries(emp).forEach(([k, v]) => {
          formik.setFieldValue(k, v, false);
          formik.setFieldTouched(k, false, false);
        });
        setFetchStatus("found");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
      } else {
        [
          "employeeName",
          "designation",
          "department",
          "dateOfJoining",
          "bankName",
          "bankAcNo",
          "email",
        ].forEach((k) => formik.setFieldValue(k, "", false));
        setFetchStatus("notfound");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [formik.values.employeeId]);

  // FIX 2: round lossOfPay to whole number
  useEffect(() => {
    const basic = Number(formik.values.basicSalary),
      payMonth = formik.values.payMonth,
      lopDays = Number(formik.values.lopDays);
    if (payMonth) {
      const date = new Date(payMonth + "-01");
      const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      formik.setFieldValue("payDays", totalDays, false);
      if (basic > 0 && lopDays >= 0) {
        formik.setFieldValue(
          "lossOfPay",
          Math.round((basic / totalDays) * lopDays),
          false,
        );
      }
    } else if (lopDays === 0) formik.setFieldValue("lossOfPay", 0, false);
  }, [formik.values.basicSalary, formik.values.payMonth, formik.values.lopDays]);

  const handleNewEmployeeProceed = () => {
    const id = newEmpIdInput.trim().toUpperCase();
    if (!id) {
      setNewEmpIdError("Please enter an Employee ID.");
      return;
    }
    checkEmployeeExists(id).then((exists) => {
      if (exists) {
        setNewEmpIdError(
          "This ID already exists. Use it in the form to auto-fill.",
        );
        return;
      }
      formik.resetForm({ values: { ...defaultValues, employeeId: id } });
      setFetchStatus("notfound");
      setIsNewJoinee(true);
      setIsNewJoineeViaModal(true);
      setIsEditMode(false);
      setShowPreview(false);
      setShowNewEmpModal(false);
      setNewEmpIdInput("");
      setNewEmpIdError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleSaveEdit = async () => {
    const AUTO_FIELDS = [
      "employeeName",
      "designation",
      "department",
      "dateOfJoining",
      "bankName",
      "bankAcNo",
      "email",
    ];
    const editData = {};
    AUTO_FIELDS.forEach((k) => {
      editData[k] = formik.values[k];
    });

    setIsSavingEdit(true);
    try {
      await updateEmployee(formik.values.employeeId, editData);
      showToast("✅ Employee details updated successfully!");
      setIsEditMode(false);
    } catch (err) {
      showToast(`❌ Failed to update: ${err.message}`, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchReceipts = async (month = filterMonth, year = filterYear) => {
    setReceiptsLoading(true);
    setReceiptsError("");
    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (year) params.set("year", year);
      const res = await authFetch(
        `${API_BASE}/api/salary/receipts?${params.toString()}`,
      );
      if (!res || !res.ok) throw new Error("Failed to fetch receipts");
      const json = await res.json();
      setReceipts(json.success ? json.data : []);
    } catch (err) {
      setReceiptsError(err.message || "Could not load receipts");
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleOpenReceipts = () => {
    setShowReceiptsModal(true);
    fetchReceipts(filterMonth, filterYear);
  };

  const handleReceiptsFilter = () => {
    fetchReceipts(filterMonth, filterYear);
  };

  const handleDownloadReceiptPDF = async (r) => {
    setDownloadingId(r._id);
    try {
      // Temporarily render the slip off-screen using receiptSlipRef
      setPreviewReceipt(r);
      await new Promise((res) => setTimeout(res, 600));

      const html2canvas = (await import("html2canvas")).default;
      const element = receiptSlipRef.current;
      if (!element) throw new Error("Slip element not found");

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      const name = (r.employeeName || "Employee").replace(/\s+/g, "_");
      pdf.save(`Salary_Slip_${name}_${r.payMonth}.pdf`);
      showToast("✅ PDF downloaded successfully!");
    } catch (err) {
      showToast(`❌ Failed to download: ${err.message}`, "error");
    } finally {
      setDownloadingId(null);
      // Keep previewReceipt set if user is in preview mode, else clear
      if (!previewReceipt || previewReceipt._id !== r._id)
        setPreviewReceipt(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    const id = formik.values.employeeId?.trim();
    if (id && id.length >= 3) {
      fetchEmployee(id).then((emp) => {
        if (emp) {
          Object.entries(emp).forEach(([k, v]) => {
            formik.setFieldValue(k, v, false);
            formik.setFieldTouched(k, false, false);
          });
        }
      });
    }
  };

  const handlePreview = async () => {
    if (fetchStatus === "notfound" && !isNewJoineeViaModal) {
      showToast("❌ Employee ID not found.");
      return;
    }
    const errors = await formik.validateForm();
    formik.setTouched(
      Object.keys(defaultValues).reduce((a, k) => ({ ...a, [k]: true }), {}),
    );
    if (Object.keys(errors).length === 0) {
      setShowPreview(true);
      setTimeout(
        () =>
          previewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        200,
      );
    }
  };

  const handleGeneratePDF = async () => {
    if (fetchStatus === "notfound" && !isNewJoineeViaModal) {
      showToast("❌ Employee ID not found.");
      return;
    }
    const errors = await formik.validateForm();
    formik.setTouched(
      Object.keys(defaultValues).reduce((a, k) => ({ ...a, [k]: true }), {}),
    );
    if (Object.keys(errors).length > 0) {
      showToast("Please fix all errors before generating.", "error");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      if (isNewJoinee && isNewJoineeViaModal) {
        await saveEmployee(formik.values.employeeId, formik.values);
        setFetchStatus("found");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
        showToast("✅ New employee saved to database!");
        await new Promise((r) => setTimeout(r, 600));
      }
      if (!showPreview) {
        setShowPreview(true);
        await new Promise((r) => setTimeout(r, 800));
      }

      const html2canvas = (await import("html2canvas")).default;

      const element = receiptRef.current;
      if (!element) throw new Error("Receipt element not found.");
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      const name = (formik.values.employeeName || "Employee").replace(
        /\s+/g,
        "_",
      );
      const month = formik.values.payMonth || "Slip";
      pdf.save(`Salary_Slip_${name}_${month}.pdf`);
      try {
        const result = await sendSalaryToBackend(
          { ...formik.values, slipImageData: imgData },
          isNewJoinee,
        );
        if (result.emailSent)
          showToast(`✅ Salary slip emailed to ${formik.values.email}`);
        else
          showToast(
            `⚠️ PDF saved. Email failed: ${result.emailError || "Unknown error"}`,
            "error",
          );
      } catch (emailErr) {
        showToast(
          `⚠️ PDF downloaded but email failed: ${emailErr.message}`,
          "error",
        );
      }
      showToast("✅ PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed: ${err.message}`, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const AUTO_FIELDS = [
    "employeeName",
    "designation",
    "department",
    "dateOfJoining",
    "bankName",
    "bankAcNo",
    "email",
  ];

  const field = (name, label, type = "text", alwaysEditable = false) => {
    const isAutoField = AUTO_FIELDS.includes(name);
    const readOnly =
      (isAutoField && !isNewJoineeViaModal && !alwaysEditable && !isEditMode) ||
      name === "payDays";
    const isNewEntry = isAutoField && isNewJoinee && isNewJoineeViaModal;
    const isEditing = isAutoField && isEditMode && fetchStatus === "found";

    return (
      <div>
        <label className="block text-[10px] sm:text-xs font-medium text-[#4A3A2A] mb-0.5 sm:mb-1">
          {label} <span className="text-red-500">*</span>
        </label>
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          readOnly={readOnly}
          placeholder={
            readOnly
              ? "Auto-filled from Employee ID"
              : isNewEntry
                ? `Enter ${label}`
                : isEditing
                  ? `Edit ${label}`
                  : ""
          }
          className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors
            ${
              formik.touched[name] && formik.errors[name]
                ? "border-red-500 focus:ring-red-500"
                : readOnly
                  ? "border-[#B0BAE8] bg-[#EEF0F8] cursor-default focus:ring-[#8A96D0]"
                  : isEditing
                    ? "border-[#D4A017] bg-[#FDF8E8] focus:ring-[#D4A017]"
                    : isNewEntry
                      ? "border-[#4A5AAE] bg-[#EEF0F8] focus:ring-[#1E2A6E] placeholder-blue-400"
                      : "border-[#D4C5B0] focus:ring-[#1E2A6E]"
            }`}
        />
        {formik.touched[name] && formik.errors[name] && (
          <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
            {formik.errors[name]}
          </p>
        )}
      </div>
    );
  };

  const earn =
    (Number(formik.values.basicSalary) || 0) +
    (Number(formik.values.incentivePay) || 0) +
    (Number(formik.values.travelAllowance) || 0);
  const ded = (Number(formik.values.lossOfPay) || 0) + (Number(formik.values.professionalTax) || 0);
  const net = Math.round(earn - ded);
  const isUnknownId = fetchStatus === "notfound" && !isNewJoineeViaModal;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 animate-spin text-[#1E2A6E]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
          <p className="text-[#8A7A6A] text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <style>{`
        @media print {
          body { background:white !important; margin:0 !important; padding:0 !important; }
          .no-print { display:none !important; }
          .print-container { display:block !important; position:relative !important; left:0 !important; visibility:visible !important; }
          @page { size:A4 portrait; margin:0; }
        }
        .preview-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      {/* ── Header ── */}
      <div className="no-print bg-white px-4 md:px-8 py-3 flex items-center gap-4 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-center flex-shrink-0 bg-white">
          <img
            src="/SKYUP_Logo.png"
            alt="Skyup Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex-1" />
        {/* ── View Receipts Button ── */}
        <button
          type="button"
          onClick={handleOpenReceipts}
          className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-[#FDF3F1] border-2 border-[#B43C28] text-black px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#B43C28]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase hidden sm:inline text-[#B43C28]">
            View Receipts
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setNewEmpIdInput("");
            setNewEmpIdError("");
            setShowNewEmpModal(true);
            setTimeout(() => newEmpIdRef.current?.focus(), 100);
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-[#F0EDE8] border-2 border-[#1E2A6E] text-black px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full transition-colors"
        >
          <span className="relative flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#D4A017] rounded-full flex items-center justify-center">
              <svg
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase hidden sm:inline">
            New Employee
          </span>
        </button>

        <div className="flex items-center gap-2 md:gap-3 pl-2 sm:pl-3 border-l border-[#E8DDD0]">
          {adminInfo && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-black text-xs font-semibold">
                {adminInfo.name}
              </span>
              <span className="text-[#B4A090] text-[10px] capitalize">
                {adminInfo.role}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#1E2A6E] hover:bg-[#B43C28] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase"
          >
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ── View Receipts Modal ── */}
      {showReceiptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm no-print px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#B43C28] px-4 sm:px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-base tracking-wide">
                  Generated Receipts
                </h3>
                <p className="text-white/80 text-[10px] sm:text-xs mt-0.5">
                  View, preview and download salary slips
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptsModal(false);
                  setPreviewReceipt(null);
                }}
                className="ml-auto text-white/70 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-4 sm:px-6 py-3 border-b border-[#EDE5D8] flex flex-wrap gap-2 items-end flex-shrink-0 bg-[#FAF7F2]">
              <div>
                <label className="block text-[10px] font-semibold text-[#8A7A6A] uppercase tracking-wider mb-1">
                  Month
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-[#D4C5B0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#B43C28] bg-white"
                >
                  <option value="">All Months</option>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, "0")}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8A7A6A] uppercase tracking-wider mb-1">
                  Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-[#D4C5B0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#B43C28] bg-white"
                >
                  <option value="">All Years</option>
                  {Array.from(
                    { length: 6 },
                    (_, i) => new Date().getFullYear() - 1 + i,
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleReceiptsFilter}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#B43C28] rounded-full hover:bg-[#8B2E1C] transition-colors"
              >
                Apply Filter
              </button>
              {(filterMonth || filterYear) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMonth("");
                    setFilterYear("");
                    fetchReceipts("", "");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#8A7A6A] border border-[#D4C5B0] rounded-full hover:bg-[#F0EAE0] transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="ml-auto text-[10px] text-[#B4A090] self-center">
                {receiptsLoading
                  ? "Loading…"
                  : `${receipts.length} receipt${receipts.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Body — list + preview side by side when preview is open */}
            <div className="flex flex-1 overflow-hidden">
              {/* Receipts List */}
              <div
                className={`overflow-y-auto px-4 sm:px-6 py-4 flex-shrink-0 ${previewReceipt ? "w-full sm:w-80 border-r border-[#EDE5D8]" : "w-full"}`}
              >
                {receiptsLoading && (
                  <div className="flex justify-center items-center py-12">
                    <svg
                      className="w-6 h-6 animate-spin text-[#B43C28]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    </svg>
                  </div>
                )}
                {!receiptsLoading && receiptsError && (
                  <div className="text-center py-10 text-red-500 text-sm">
                    {receiptsError}
                  </div>
                )}
                {!receiptsLoading &&
                  !receiptsError &&
                  receipts.length === 0 && (
                    <div className="text-center py-12 text-[#B4A090]">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-[#D4C5B0]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium">No receipts found</p>
                      <p className="text-xs mt-1">
                        Try a different month or year filter
                      </p>
                    </div>
                  )}
                {!receiptsLoading && !receiptsError && receipts.length > 0 && (
                  <div className="space-y-2">
                    {receipts.map((r) => {
                      const payMonthLabel = r.payMonth
                        ? new Date(r.payMonth + "-01").toLocaleDateString(
                            "en-IN",
                            { month: "long", year: "numeric" },
                          )
                        : r.payMonth;
                      const generatedAt = r.createdAt
                        ? new Date(r.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";
                      const fmt = (n) =>
                        Math.round(Number(n || 0)).toLocaleString("en-IN");
                      const isSelected = previewReceipt?._id === r._id;
                      const isDownloading = downloadingId === r._id;
                      return (
                        <div
                          key={r._id}
                          className={`border rounded-xl p-3 transition-colors ${isSelected ? "border-[#B43C28] bg-[#FDF3F1]" : "border-[#E8DDD0] hover:border-[#E8A090] hover:bg-[#FDF3F1]/30"}`}
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#FDF3F1] flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-[#B43C28]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#2A1F14]">
                                  {r.employeeName}
                                </p>
                                <p className="text-[10px] text-[#B4A090] font-mono">
                                  {r.employeeId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-[#B43C28] bg-[#FDF3F1] border border-[#E8A090] px-2 py-0.5 rounded-full">
                                {payMonthLabel}
                              </span>
                              {r.isNewJoinee && (
                                <span className="text-[10px] font-bold text-[#1E2A6E] bg-[#EEF0F8] border border-[#B0BAE8] px-2 py-0.5 rounded-full">
                                  New Joinee
                                </span>
                              )}
                              {r.emailSent ? (
                                <span className="text-[10px] text-[#2A7A4A] bg-[#F0FAF4] border border-[#80C8A0] px-2 py-0.5 rounded-full">
                                  ✓ Email Sent
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#B4A090] bg-[#FAF7F2] border border-[#E8DDD0] px-2 py-0.5 rounded-full">
                                  Email Pending
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="bg-white border border-[#EDE5D8] rounded-lg px-2.5 py-1.5">
                              <p className="text-[9px] text-[#B4A090] uppercase tracking-wider">
                                Net Salary
                              </p>
                              <p className="text-xs font-bold text-[#2A1F14]">
                                ₹{fmt(r.netSalary)}
                              </p>
                            </div>
                            <div className="bg-white border border-[#EDE5D8] rounded-lg px-2.5 py-1.5">
                              <p className="text-[9px] text-[#B4A090] uppercase tracking-wider">
                                Generated
                              </p>
                              <p className="text-[10px] font-semibold text-[#4A3A2A]">
                                {generatedAt}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#B4A090] mt-1.5 mb-2">
                            📧 {r.email}
                          </p>

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewReceipt(isSelected ? null : r)
                              }
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all
                                ${
                                  isSelected
                                    ? "bg-[#B43C28] text-white border-[#B43C28]"
                                    : "bg-white text-[#B43C28] border-green-600 hover:bg-[#FDF3F1]"
                                }`}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              {isSelected ? "Hide Preview" : "View Receipt"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadReceiptPDF(r)}
                              disabled={isDownloading}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-blue-600 text-[#1E2A6E] bg-white hover:bg-[#F0EDE8] transition-all disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <svg
                                  className="w-3.5 h-3.5 animate-spin"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              )}
                              {isDownloading ? "Downloading…" : "Download PDF"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Slip Preview Panel */}
              {previewReceipt && (
                <div className="hidden sm:flex flex-1 overflow-y-auto flex-col items-center bg-[#F0EAE0] p-4">
                  <div className="flex items-center justify-between w-full mb-3">
                    <p className="text-xs font-semibold text-[#6A5A4A]">
                      Preview — {previewReceipt.employeeName} /{" "}
                      {previewReceipt.payMonth}
                    </p>
                    <button
                      onClick={() => setPreviewReceipt(null)}
                      className="text-[#B4A090] hover:text-[#4A3A2A] text-xs flex items-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Close
                    </button>
                  </div>
                  <div
                    style={{
                      width: "420px",
                      height: "595px",
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                      borderRadius: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "794px",
                        height: "1123px",
                        transform: "scale(0.529)",
                        transformOrigin: "top left",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <SlipContent
                        values={previewReceipt}
                        isNewJoinee={previewReceipt.isNewJoinee}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Employee Modal ── */}
      {showNewEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm no-print px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-[#1E2A6E] px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-base tracking-wide">
                  Add New Employee
                </h3>
                <p className="text-white/80 text-[10px] sm:text-xs mt-0.5">
                  Enter a unique Employee ID to start manual entry
                </p>
              </div>
              <button
                onClick={() => setShowNewEmpModal(false)}
                className="ml-auto text-white/70 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-[#4A3A2A] mb-1.5 uppercase tracking-wider">
                  New Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  ref={newEmpIdRef}
                  type="text"
                  value={newEmpIdInput}
                  onChange={(e) => {
                    setNewEmpIdInput(e.target.value.toUpperCase());
                    setNewEmpIdError("");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNewEmployeeProceed()
                  }
                  placeholder="e.g. EMP005"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border-2 rounded-lg font-mono tracking-widest focus:outline-none transition-colors
                    ${newEmpIdError ? "border-red-400 bg-red-50" : "border-[#8A96D0] focus:border-blue-500 bg-[#EEF0F8]"}`}
                />
                {newEmpIdError && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {newEmpIdError}
                  </p>
                )}
                <p className="text-[#B4A090] text-[10px] sm:text-xs mt-1.5">
                  All personal details will be editable. Employee will be saved
                  to the database on PDF generation.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  "Manual entry for all fields",
                  "New Joinee badge on slip",
                  "Saved to DB on PDF generation",
                ].map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#1E2A6E] bg-[#EEF0F8] border border-[#B0BAE8] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium"
                  >
                    <svg
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2 sm:gap-3 justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setShowNewEmpModal(false)}
                className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#6A5A4A] border-2 border-[#E8DDD0] rounded-full hover:bg-[#FAF7F2] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNewEmployeeProceed}
                className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-[#1E2A6E] rounded-full shadow hover:shadow-lg hover:scale-105 transition-all duration-200 tracking-wide"
              >
                Proceed to Manual Entry →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Body ── */}
      <div className="no-print w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10">
        <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-[#2A1F14] mb-4 sm:mb-6 text-center">
          Salary Slip Form
        </h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 space-y-4 sm:space-y-6">
            {/* ── NEW JOINEE BANNER ── */}
            {isNewJoinee && isNewJoineeViaModal && (
              <div className="flex items-start gap-2 sm:gap-3 bg-[#1E2A6E] border border-[#8A96D0] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#1E2A6E] rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm">
                    New Employee — Manual Entry Mode
                  </p>
                  <p className="text-blue-100 text-[10px] sm:text-xs mt-0.5 leading-relaxed">
                    Employee ID{" "}
                    <strong className="font-mono">
                      {formik.values.employeeId}
                    </strong>{" "}
                    is being registered. Fill in all details manually — they
                    will be <strong>saved to the database</strong> when you
                    generate the PDF.
                  </p>
                </div>
              </div>
            )}

            {/* ── EDIT MODE BANNER ── */}
            {isEditMode && fetchStatus === "found" && (
              <div className="flex items-start gap-2 sm:gap-3 bg-[#FDF8E8] border border-[#E8CC80] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#D4A017] rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[#8B6A10] font-semibold text-xs sm:text-sm">
                    Edit Mode — Modifying Employee Details
                  </p>
                  <p className="text-[#A07A18] text-[10px] sm:text-xs mt-0.5 leading-relaxed">
                    Changes to employee details for{" "}
                    <strong className="font-mono">
                      {formik.values.employeeId}
                    </strong>{" "}
                    will be saved to the database when you click{" "}
                    <strong>Save Changes</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] sm:text-xs text-[#A07A18] hover:text-amber-900 border border-[#E8CC80] px-2 py-1 rounded-full bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="text-[10px] sm:text-xs text-white bg-[#FDF8E8]0 hover:bg-[#B08810] px-3 py-1 rounded-full font-semibold transition-colors disabled:opacity-60"
                  >
                    {isSavingEdit ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Employee ID + Pay Month ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-[#4A3A2A] mb-0.5 sm:mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formik.values.employeeId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. EMP001"
                  disabled={isNewJoinee && isNewJoineeViaModal}
                  className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 font-mono tracking-widest
                    ${
                      formik.touched.employeeId && formik.errors.employeeId
                        ? "border-red-500 focus:ring-red-500"
                        : isUnknownId
                          ? "border-red-400 bg-red-50 focus:ring-red-400"
                          : isNewJoineeViaModal
                            ? "border-[#4A5AAE] bg-[#EEF0F8] cursor-default focus:ring-[#8A96D0]"
                            : "border-[#D4C5B0] focus:ring-[#1E2A6E]"
                    }`}
                />
                {fetchStatus === "loading" && (
                  <p className="text-amber-600 text-[10px] sm:text-xs mt-0.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    </svg>
                    Fetching…
                  </p>
                )}
                {fetchStatus === "found" && !isNewJoinee && !isEditMode && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[#B43C28] text-[10px] sm:text-xs">
                      ✓ Employee details loaded
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#A07A18] bg-[#FDF8E8] border border-[#E8CC80] hover:bg-amber-100 px-1.5 py-0.5 rounded-full font-semibold transition-colors"
                    >
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Details
                    </button>
                  </div>
                )}
                {isUnknownId && (
                  <p className="text-red-600 text-[10px] sm:text-xs mt-0.5 font-semibold flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Invalid Employee ID — not registered
                  </p>
                )}
                {isNewJoineeViaModal && (
                  <p className="text-[#1E2A6E] text-[10px] sm:text-xs mt-0.5 font-medium">
                    ✦ New employee — fill in all details below
                  </p>
                )}
                {formik.touched.employeeId && formik.errors.employeeId && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.employeeId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-[#4A3A2A] mb-0.5 sm:mb-1">
                  Pay Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  name="payMonth"
                  value={formik.values.payMonth}
                  onChange={(e) => {
                    formik.setFieldValue("payMonth", e.target.value, true);
                    formik.setFieldTouched("payMonth", true, false);
                  }}
                  onBlur={() => formik.setFieldTouched("payMonth", true, true)}
                  className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white
      ${
        formik.touched.payMonth && formik.errors.payMonth
          ? "border-red-500 focus:ring-red-500"
          : "border-[#D4C5B0] focus:ring-[#1E2A6E]"
      }`}
                />
                {formik.touched.payMonth && formik.errors.payMonth && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.payMonth}
                  </p>
                )}
              </div>
            </div>

            {/* ── Auto-filled / Editable Fields ── */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 ${isUnknownId ? "opacity-50 pointer-events-none select-none" : ""}`}
            >
              {field("employeeName", "Employee Name")}
              {field("designation", "Designation")}
              {field("department", "Department")}
              {field("dateOfJoining", "Date of Joining", "date")}
              {field("bankName", "Bank Name")}
              {field("bankAcNo", "Bank A/C No")}
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-[#4A3A2A] mb-0.5 sm:mb-1">
                Employee Email
                <span className="ml-1 sm:ml-1.5 text-[8px] sm:text-[9px] tracking-wide text-[#1E2A6E] bg-[#EEF0F8] border border-[#B0BAE8] px-1 sm:px-1.5 py-0.5 rounded font-semibold uppercase">
                  Used to send PDF
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                readOnly={
                  !isNewJoineeViaModal && !isEditMode && fetchStatus === "found"
                }
                placeholder={
                  isNewJoineeViaModal || isEditMode
                    ? "Enter employee email"
                    : "Auto-filled from Employee ID"
                }
                className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors
                  ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : isEditMode
                        ? "border-[#D4A017] bg-[#FDF8E8] focus:ring-[#D4A017]"
                        : !isNewJoineeViaModal && fetchStatus === "found"
                          ? "border-[#B0BAE8] bg-[#EEF0F8] cursor-default focus:ring-[#8A96D0]"
                          : isNewJoineeViaModal
                            ? "border-[#4A5AAE] bg-[#EEF0F8] focus:ring-[#1E2A6E] placeholder-blue-400"
                            : "border-[#D4C5B0] focus:ring-[#1E2A6E]"
                  }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                  {formik.errors.email}
                </p>
              )}
              {formik.values.email && (
                <p className="text-[#1E2A6E] text-[10px] sm:text-xs mt-0.5">
                  📧 Salary slip will be sent to this address on PDF generation
                </p>
              )}
            </div>

            {/* ── Attendance ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-[#2A1F14] mb-1.5 sm:mb-2">
                Attendance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {field("payDays", "Total Days in Month", "number", true)}
                {field("lopDays", "LOP Days", "number", true)}
              </div>
            </div>

            {/* ── Earnings ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-[#2A1F14] mb-1.5 sm:mb-2">
                Earnings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {field("basicSalary", "Basic Salary (₹)", "number", true)}
                {field("incentivePay", "Incentive Pay (₹)", "number", true)}
                {field(
                  "travelAllowance",
                  "Travel Allowance (₹)",
                  "number",
                  true,
                )}
              </div>
              <div className="mt-2.5 sm:mt-3">
                {field(
                  "professionalTax",
                  "Professional Tax (₹)",
                  "number",
                  true,
                )}
              </div>
              <div className="mt-2.5 sm:mt-3">
                {field("transactionId", "Transaction ID", "text", true)}
              </div>
            </div>

            {/* ── Deductions ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-[#2A1F14] mb-1.5 sm:mb-2">
                Deductions
              </h3>
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-[#4A3A2A] mb-0.5 sm:mb-1">
                  Loss of Pay (₹)
                  <span className="ml-1 sm:ml-1.5 text-[8px] sm:text-[9px] tracking-wide text-[#6A3A7E] bg-[#F5EFF8] border border-[#C8A0D8] px-1 sm:px-1.5 py-0.5 rounded font-semibold uppercase">
                    Auto-Calculated
                  </span>
                </label>
                <input
                  type="number"
                  name="lossOfPay"
                  value={formik.values.lossOfPay}
                  readOnly
                  className="w-full sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-[#B0BAE8] bg-[#EEF0F8] text-[#1E2A6E] rounded-md cursor-default focus:outline-none font-semibold"
                />
                {formik.touched.lossOfPay && formik.errors.lossOfPay && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.lossOfPay}
                  </p>
                )}
              </div>
            </div>

            {/* ── Net Salary Summary ── */}
            <div
              className={`border rounded-md p-2.5 sm:p-3 ${net > 0 ? "bg-[#EEF0F8] border-[#B0BAE8]" : "bg-[#FAF7F2] border-[#E8DDD0]"}`}
            >
              <div
                className={`text-xs sm:text-sm font-semibold ${net > 0 ? "text-[#1E2A6E]" : "text-[#6A5A4A]"}`}
              >
                Net Salary: ₹{net.toLocaleString("en-IN")}
              </div>
              <div
                className={`text-[10px] sm:text-xs mt-0.5 ${net > 0 ? "text-[#1E2A6E]" : "text-[#8A7A6A]"}`}
              >
                {net > 0
                  ? `${numberToWords(net)} Rupees Only`
                  : "Fill in salary details above"}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={handlePreview}
                disabled={isUnknownId}
                className={`w-full sm:w-auto px-4 sm:px-6 py-1.5 sm:py-2 border-2 border-[#1E2A6E] text-[#1E2A6E] text-xs sm:text-sm font-semibold rounded-full hover:bg-[#1E2A6E] hover:text-white transition-all duration-200
                  ${isUnknownId ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                PREVIEW SLIP
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || isUnknownId}
                className={`w-full sm:w-auto px-6 sm:px-10 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-[#1E2A6E]
                  ${isGeneratingPDF || isUnknownId ? "opacity-40 cursor-not-allowed hover:scale-100" : ""}`}
              >
                {isGeneratingPDF
                  ? "Generating…"
                  : isNewJoinee && isNewJoineeViaModal
                    ? "SAVE & GENERATE PDF"
                    : "GENERATE PDF"}
              </button>
            </div>

            {/* ── Unknown ID hint ── */}
            {isUnknownId && (
              <div className="text-center py-1">
                <p className="text-[10px] sm:text-xs text-[#B4A090]">
                  Enter a valid Employee ID, or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmpIdInput(formik.values.employeeId);
                      setNewEmpIdError("");
                      setShowNewEmpModal(true);
                      setTimeout(() => newEmpIdRef.current?.focus(), 100);
                    }}
                    className="text-[#1E2A6E] font-semibold underline hover:text-[#1E2A6E]"
                  >
                    register this ID as a new employee
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </form>

        {/* ── Inline Preview ── */}
        {showPreview && (
          <div
            ref={previewRef}
            className="mt-6 sm:mt-8 bg-white rounded-xl p-3 sm:p-4 md:p-6 w-full max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#2A1F14]">
                  Salary Slip Preview
                </h3>
                {isNewJoinee && isNewJoineeViaModal && (
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white bg-[#1E2A6E] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    ✦ New Joinee
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[#B4A090] hover:text-[#4A3A2A] text-xs sm:text-sm flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Close Preview
              </button>
            </div>

            <style>{`
      .slip-outer { width: 595px; height: 842px; }
      .slip-inner { transform: scale(0.75); }
      @media (max-width: 639px) {
        .slip-outer { width: calc(100vw - 48px); height: calc((100vw - 48px) * 1.414); }
        .slip-inner { transform: scale(calc((100vw - 48px) / 794)); }
      }
    `}</style>

            <div
              className="slip-outer overflow-hidden mx-auto"
              style={{
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                borderRadius: "4px",
              }}
            >
              <div
                className="slip-inner"
                style={{
                  width: "794px",
                  height: "1123px",
                  transformOrigin: "top left",
                  backgroundColor: "#ffffff",
                }}
              >
                <SlipContent values={formik.values} isNewJoinee={isNewJoinee} />
              </div>
            </div>
          </div>
        )}

        <div
          className="print-container"
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "794px",
            height: "1123px",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <div ref={receiptRef} style={{ width: "794px", height: "1123px" }}>
            <SlipContent values={formik.values} isNewJoinee={isNewJoinee} />
          </div>
        </div>

        {/* Hidden renderer for receipt PDF download */}
        {previewReceipt && (
          <div
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              width: "794px",
              height: "1123px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              zIndex: -1,
            }}
          >
            <div
              ref={receiptSlipRef}
              style={{ width: "794px", height: "1123px" }}
            >
              <SlipContent
                values={previewReceipt}
                isNewJoinee={previewReceipt.isNewJoinee}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-4 sm:bottom-6 right-3 left-3 sm:right-4 sm:left-4 md:left-auto md:right-6 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium text-white shadow-xl ${toast.type === "error" ? "bg-red-600" : "bg-[#1E2A6E]"}`}
        >
          <span className="flex-1">{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 sm:ml-2 opacity-60 hover:opacity-100 text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}