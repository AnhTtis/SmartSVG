Mình đề xuất xây project theo hướng **không cố cạnh tranh với Power BI/Tableau**, mà tập trung vào **Explainable AI + Data Analysis + Custom SVG Visualization Engine**. Với mục tiêu xin intern DS/AE/DA, đây là hướng có "technical depth" tốt hơn.

# Explainable AI Data Visualization & SVG Analytics Engine

> **Project Type:** Data Science × AI Engineering × Data Analytics × Visualization
> **Primary Goal:** Xây dựng một hệ thống phân tích dữ liệu tương tác, trong đó người dùng có thể đặt câu hỏi bằng ngôn ngữ tự nhiên; hệ thống lập kế hoạch phân tích, thực hiện các phép tính có thể kiểm chứng, sinh visualization bằng SVG và giải thích insight dựa trên evidence thay vì để LLM tự suy đoán.
>
> **Target Users:** Data Analyst, Data Scientist, Business Analyst
> **Target Portfolio:** Internship — Data Scientist / AI Engineer / Data Analyst

---

# 1. Executive Summary

## 1.1. Problem

Các hệ thống BI hiện nay đã hỗ trợ:

* Upload dữ liệu.
* Tạo dashboard.
* Natural-language query.
* AI-generated visualization.
* AI-generated insights.

Do đó, việc xây dựng đơn thuần:

```text
CSV → LLM → Chart
```

không tạo ra nhiều khác biệt.

Project này tập trung vào một vấn đề sâu hơn:

> **Làm thế nào để AI chuyển một analytical question thành một chuỗi phân tích có thể kiểm chứng, sau đó biểu diễn evidence bằng interactive SVG và tạo ra insight có nguồn gốc rõ ràng?**

---

# 2. Project Vision

## 2.1. Core Pipeline

```text
                    USER
                      │
                      ▼
             Natural Language
             Analytical Query
                      │
                      ▼
              Intent Parser
                      │
                      ▼
             Analysis Planner
                      │
                      ▼
          ┌──────────────────────┐
          │ Deterministic Engine │
          └──────────┬───────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Statistics  Aggregation  ML Analysis
          │          │          │
          └──────────┼──────────┘
                     ▼
                  Evidence
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    Visualization Spec      Insight Generator
          │                     │
          ▼                     ▼
       SVG Engine          Explanation
          │                     │
          └──────────┬──────────┘
                     ▼
               Interactive UI
```

---

# 3. Core Design Principle

## Không để LLM trực tiếp "vẽ biểu đồ"

LLM chỉ nên chịu trách nhiệm:

```text
Natural Language
       ↓
Intent
       ↓
Analysis Plan
       ↓
Visualization Specification
```

Các phép tính quan trọng phải được thực hiện bởi deterministic code.

Ví dụ:

```json
{
  "analysis": "revenue_trend",
  "x": "date",
  "y": "revenue",
  "group_by": "region",
  "aggregation": "sum",
  "chart": "line"
}
```

Sau đó backend/analytics engine thực hiện:

```text
GROUP BY
SUM
MEAN
STD
CORRELATION
REGRESSION
ANOMALY DETECTION
```

Cuối cùng SVG engine render kết quả.

### Nguyên tắc

> **LLM decides what to analyze.
> Deterministic code decides the numerical result.
> SVG decides how the evidence is presented.**

Đây là nguyên tắc quan trọng nhất của project.

---

# 4. Objectives

## 4.1. Primary Objectives

### O1 — Data Understanding

Tự động profiling dataset:

* Schema detection
* Numerical / categorical / datetime detection
* Missing values
* Cardinality
* Unique values
* Distribution
* Basic statistics
* Correlation
* Potential outliers

### O2 — Natural Language Analytics

Cho phép user hỏi:

```text
"Doanh thu theo tháng là bao nhiêu?"

"Region nào tăng trưởng nhanh nhất?"

"Top 10 sản phẩm theo revenue?"

"Revenue tháng nào bất thường?"

"Tại sao revenue giảm trong Q3?"

"Correlation giữa advertising spend và revenue là bao nhiêu?"
```

### O3 — Analytical Planning

LLM chuyển câu hỏi thành structured analysis plan.

### O4 — Deterministic Analytics

Thực hiện phân tích bằng code.

### O5 — Custom SVG Visualization Engine

Không phụ thuộc hoàn toàn vào chart library.

Tự xây các primitive:

* Axis
* Scale
* Line
* Rect
* Circle
* Path
* Text
* Grid
* Tooltip
* Legend

### O6 — Explainable Insight

Mỗi insight phải liên kết với evidence.

### O7 — Evaluation

Đánh giá:

* Intent accuracy
* Query accuracy
* Numerical accuracy
* Chart selection accuracy
* Insight accuracy
* Hallucination rate
* Latency

---

# 5. Non-Goals

Không cố xây:

* Full Power BI clone
* Full Tableau clone
* Photoshop/Figma clone
* General-purpose LLM
* General-purpose BI platform
* 100 loại chart
* Complex enterprise authentication ở MVP

Mục tiêu là **technical depth**, không phải số lượng feature.

---

# 6. Target Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                                                             │
│ React + TypeScript                                          │
│                                                             │
│ ┌────────────┐ ┌─────────────┐ ┌────────────────────────┐ │
│ │ Data View  │ │ Chat Panel  │ │ Visualization Canvas   │ │
│ └────────────┘ └─────────────┘ └────────────────────────┘ │
│                                      │                      │
│                                      ▼                      │
│                              Custom SVG Engine              │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST / WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│                                                             │
│ FastAPI + Python                                            │
│                                                             │
│ ┌─────────────┐   ┌────────────────┐   ┌─────────────────┐ │
│ │ Data Loader │ → │ Data Profiler  │ → │ Analysis Engine │ │
│ └─────────────┘   └────────────────┘   └─────────────────┘ │
│                                               │             │
│                                               ▼             │
│                                      Evidence Generator     │
│                                               │             │
│                        ┌──────────────────────┘             │
│                        ▼                                    │
│                 LLM Orchestrator                            │
│                        │                                    │
│                        ▼                                    │
│                 Insight Generator                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ PostgreSQL / Storage  │
              └──────────────────────┘
```

---

# 7. Recommended Technology Stack

## 7.1. Frontend

### Language

**TypeScript**

Lý do:

* Type safety.
* SVG DOM manipulation tốt.
* Phù hợp React.
* Dễ maintain.
* Có lợi cho AI/Full-stack internship.

### Framework

**React + TypeScript + Vite**

Không cần Next.js ở MVP.

### Styling

**Normal CSS / CSS Modules**

Không cần Tailwind.

### Visualization

Core:

```text
Native SVG
+
D3-scale
+
D3-shape
+
D3-array
```

Không dùng D3 để biến toàn bộ project thành "D3 project".

Mục tiêu:

> Tự xây visualization engine nhưng tận dụng các primitive toán học đã được kiểm chứng của D3.

---

# 8. Backend

## Language

**Python 3.12+**

Đây là lựa chọn tốt nhất cho project này vì project có cả:

* Data Science
* Statistics
* ML
* LLM
* API

## Framework

**FastAPI**

Lý do:

* Async support.
* Type hints.
* Automatic OpenAPI documentation.
* Dễ tích hợp Python ecosystem.
* Phù hợp AI backend.

---

# 9. Data Stack

## Core

```text
pandas
numpy
scipy
scikit-learn
```

## Recommended

Thêm:

```text
Polars
DuckDB
PyArrow
```

### Tại sao DuckDB?

Thay vì đưa toàn bộ dataset vào Python memory:

```text
CSV
 ↓
pandas
 ↓
analysis
```

có thể:

```text
CSV / Parquet
      ↓
    DuckDB
      ↓
 SQL / Aggregation
      ↓
 Analysis
```

Điều này rất tốt để thể hiện kiến thức Data Engineering / Analytics.

---

# 10. LLM Layer

Không hard-code vào một provider duy nhất.

Thiết kế abstraction:

```text
LLMProvider
    │
    ├── OpenAI
    ├── Gemini
    ├── Anthropic
    └── Local Model
```

Ví dụ interface:

```python
class LLMProvider:
    def generate(self, messages, schema):
        ...
```

LLM phải trả về structured output.

---

# 11. LLM Output Schema

Ví dụ:

```json
{
  "intent": "trend_analysis",
  "dataset": "sales",
  "dimensions": [
    "month"
  ],
  "metrics": [
    {
      "column": "revenue",
      "aggregation": "sum"
    }
  ],
  "filters": [],
  "group_by": [],
  "visualization": {
    "type": "line",
    "x": "month",
    "y": "revenue"
  }
}
```

Không cho LLM tự sinh Python code tùy ý.

---

# 12. Analysis Planner

Analysis Planner là thành phần quan trọng.

Input:

```text
"Region nào có tốc độ tăng trưởng revenue cao nhất?"
```

Output:

```text
1. Identify date column
2. Identify region column
3. Aggregate revenue by region and period
4. Calculate growth rate
5. Rank regions
6. Identify top region
7. Generate evidence
8. Generate visualization
```

Representation:

```json
{
  "steps": [
    {
      "operation": "group_by",
      "columns": ["region", "year"]
    },
    {
      "operation": "aggregate",
      "metric": "revenue",
      "function": "sum"
    },
    {
      "operation": "growth_rate"
    },
    {
      "operation": "rank"
    }
  ]
}
```

---

# 13. Deterministic Analysis Engine

## Basic Operations

```text
COUNT
SUM
MEAN
MEDIAN
MIN
MAX
STD
VAR
QUANTILE
```

## Group Operations

```text
GROUP BY
PIVOT
ROLLING
RESAMPLE
```

## Statistical Operations

```text
Correlation
Covariance
Z-score
Confidence interval
Hypothesis testing
```

## ML Operations

MVP:

```text
Linear Regression
Clustering
Anomaly Detection
```

Advanced:

```text
Forecasting
Classification
Segmentation
```

---

# 14. Evidence Layer

Đây là thành phần giúp project khác với chatbot thông thường.

Ví dụ insight:

> Revenue giảm 18.4% trong Q3.

Evidence phải lưu:

```json
{
  "claim": "Revenue decreased by 18.4% in Q3.",
  "evidence": {
    "metric": "revenue",
    "period": "Q3",
    "previous_period": "Q2",
    "value_current": 815000,
    "value_previous": 999000,
    "change_percent": -18.42
  }
}
```

Insight chỉ được tạo nếu evidence tồn tại.

---

# 15. SVG Engine

Đây là phần đặc trưng nhất của project.

## 15.1. Core abstraction

```typescript
interface Mark {
    render(): SVGElement;
    update(data: unknown): void;
}
```

Các component:

```text
SVGCanvas
Axis
Scale
Grid
Legend
Tooltip
Bar
Line
Circle
Path
Text
```

---

# 16. Visualization Architecture

```text
Data
 │
 ▼
Visualization Specification
 │
 ▼
Scale Calculation
 │
 ├── X Scale
 ├── Y Scale
 └── Color Scale
 │
 ▼
Marks
 │
 ├── Rect
 ├── Circle
 ├── Path
 └── Text
 │
 ▼
SVG DOM
```

---

# 17. Charts

## MVP

Chỉ cần 5 loại:

### 1. Bar Chart

Dùng cho:

* Comparison
* Ranking
* Category analysis

### 2. Line Chart

Dùng cho:

* Time series
* Trend

### 3. Scatter Plot

Dùng cho:

* Correlation
* Distribution
* Outlier

### 4. Histogram

Dùng cho:

* Distribution

### 5. Heatmap

Dùng cho:

* Correlation matrix
* Category × time

Không nên làm 20 loại chart trong MVP.

---

# 18. Interactive SVG

Phải có:

```text
Hover
Click
Zoom
Pan
Selection
Tooltip
Highlight
Filtering
```

Ví dụ:

```text
User clicks anomaly
        ↓
SVG highlights point
        ↓
Evidence panel opens
        ↓
Analysis details displayed
```

Đây là một feature rất quan trọng để chứng minh SVG không chỉ là static image.

---

# 19. Natural Language → Visualization

Ví dụ:

### User

```text
Show monthly revenue by region.
```

### LLM

```json
{
  "intent": "time_series_comparison",
  "x": "month",
  "y": "revenue",
  "group_by": "region",
  "chart": "line"
}
```

### Backend

```text
Validate columns
       ↓
Aggregate data
       ↓
Return analytical dataset
```

### Frontend

```text
Visualization Spec
       ↓
Scale
       ↓
SVG
```

---

# 20. Insight Generation

Insight engine nên có hai tầng.

## Layer 1 — Statistical / Rule-based

Ví dụ:

```text
growth > threshold
outlier detected
correlation > threshold
top category
bottom category
change point
```

## Layer 2 — LLM

LLM biến evidence thành ngôn ngữ tự nhiên.

Ví dụ:

```text
Revenue increased by 24.8% year-over-year,
with Region A contributing approximately 61%
of the total increase.
```

LLM không tự tính 24.8%.

Nó nhận:

```json
{
  "growth": 24.8,
  "contribution": 61
}
```

và chỉ diễn đạt lại.

---

# 21. Hallucination Control

Đây là một trong những phần nên đưa vào CV.

## Rule

LLM không được tạo numerical claim nếu không có evidence.

Pipeline:

```text
LLM claim
   ↓
Claim Parser
   ↓
Evidence Matcher
   ↓
Validation
   │
   ├── PASS → Display
   │
   └── FAIL → Reject / Regenerate
```

---

# 22. Evaluation Framework

Đây là phần rất quan trọng.

Tạo benchmark:

```text
100–300 analytical questions
```

Ví dụ:

```text
Q001:
"What is the monthly revenue trend?"

Q002:
"Which region has the highest revenue?"

Q003:
"Find unusual revenue values."

Q004:
"Why did revenue decrease in Q3?"
```

---

# 23. Metrics

## Intent Accuracy

```text
correct_intent / total_questions
```

## Query Accuracy

So sánh analytical plan với ground truth.

## Numerical Accuracy

```text
|predicted - actual|
```

## Visualization Accuracy

```text
Correct chart type
Correct x-axis
Correct y-axis
Correct aggregation
```

## Insight Accuracy

Kiểm tra claim có được evidence hỗ trợ hay không.

## Hallucination Rate

```text
unsupported claims / total claims
```

## Latency

```text
Question → final visualization
```

---

# 24. Dataset Strategy

Không nên chỉ dùng một dataset.

## Dataset 1 — Sales

```text
date
product
region
revenue
cost
quantity
```

## Dataset 2 — Customer

```text
customer_id
age
region
segment
spending
```

## Dataset 3 — E-commerce

```text
order_id
product
category
price
quantity
discount
date
```

## Dataset 4 — Public Real-world Dataset

Chọn một dataset có business meaning.

Mục tiêu:

> Hệ thống phải hoạt động với dataset chưa từng thấy.

---

# 25. API Design

## POST

```text
/api/datasets/upload
```

Upload dataset.

## GET

```text
/api/datasets/{id}/profile
```

Dataset profiling.

## POST

```text
/api/analysis/query
```

Natural language query.

Request:

```json
{
  "dataset_id": "sales_001",
  "question": "Which region has the highest revenue?"
}
```

Response:

```json
{
  "analysis_plan": {},
  "result": {},
  "visualization": {},
  "insights": [],
  "evidence": []
}
```

---

# 26. Database

MVP có thể dùng:

```text
PostgreSQL
```

Tables:

```text
datasets
analysis_sessions
queries
analysis_plans
analysis_results
insights
visualizations
```

Không nhất thiết lưu toàn bộ raw CSV vào PostgreSQL.

Có thể:

```text
Raw files → Object/File Storage
Metadata → PostgreSQL
Analytical query → DuckDB
```

---

# 27. Project Structure

```text
svg-ai-analytics/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── api/
│   │   └── svg-engine/
│   │       ├── core/
│   │       ├── scales/
│   │       ├── axes/
│   │       ├── marks/
│   │       │   ├── bar.ts
│   │       │   ├── line.ts
│   │       │   ├── circle.ts
│   │       │   └── path.ts
│   │       └── charts/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── analytics/
│   │   ├── llm/
│   │   ├── evidence/
│   │   └── visualization/
│   │
│   ├── tests/
│   └── pyproject.toml
│
├── evaluation/
│   ├── datasets/
│   ├── questions/
│   ├── ground_truth/
│   ├── metrics/
│   └── reports/
│
├── data/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── evaluation.md
│   └── design.md
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 28. Development Roadmap

## Phase 0 — Research

### Duration: 2–3 days

Nghiên cứu:

* SVG DOM
* D3 scales
* D3 shapes
* Data visualization principles
* LLM structured output
* Tool calling
* Analytical query planning

Output:

```text
Architecture document
Technical specification
```

---

# Phase 1 — SVG Engine

### Duration: 1 week

Implement:

```text
SVGCanvas
Scale
Axis
Bar
Line
Circle
Text
```

Sau đó:

```text
Tooltip
Hover
Selection
```

### Deliverable

Có thể truyền:

```typescript
{
    chart: "bar",
    x: "category",
    y: "revenue"
}
```

và render SVG.

---

# Phase 2 — Data Engine

### Duration: 1 week

Implement:

```text
CSV upload
Schema detection
Data profiling
Aggregation
Filtering
Sorting
Statistics
```

Kết hợp:

```text
FastAPI
DuckDB
Polars/Pandas
```

### Deliverable

Dataset → analytical result.

---

# Phase 3 — Visualization Specification

### Duration: 3–4 days

Thiết kế schema thống nhất:

```text
AnalysisPlan
VisualizationSpec
Evidence
Insight
```

Mục tiêu:

```text
Analysis Spec
      ↓
SVG Engine
```

không phụ thuộc LLM.

---

# Phase 4 — LLM Integration

### Duration: 1 week

Implement:

```text
Question
 ↓
Intent
 ↓
Structured Analysis Plan
 ↓
Validation
 ↓
Execution
```

LLM phải output structured JSON.

---

# Phase 5 — Evidence & Insight

### Duration: 4–5 days

Implement:

```text
Evidence Generator
Claim Validator
Insight Generator
```

Mỗi insight phải có:

```text
Claim
Evidence
Metric
Source rows / aggregation
Confidence
```

---

# Phase 6 — Interactive UI

### Duration: 1 week

Build:

```text
Dataset Explorer
Chat Panel
SVG Canvas
Evidence Panel
Insight Panel
```

Layout:

```text
┌──────────────────────────────────────────────┐
│ Dataset / Project                            │
├─────────────┬──────────────────┬─────────────┤
│ Data        │                  │ AI Analysis │
│ Explorer    │    SVG Canvas    │             │
│             │                  │ Insight     │
│ Columns     │                  │ Evidence    │
│ Statistics  │                  │             │
└─────────────┴──────────────────┴─────────────┘
```

---

# Phase 7 — Evaluation

### Duration: 1 week

Build benchmark:

```text
100–300 questions
```

Measure:

```text
Intent Accuracy
Plan Accuracy
Numerical Accuracy
Visualization Accuracy
Insight Accuracy
Hallucination Rate
Latency
```

Generate evaluation report.

---

# Phase 8 — Deployment

### Duration: 3–4 days

Use:

```text
Docker
Docker Compose
GitHub Actions
```

Deployment:

```text
Frontend
Backend
PostgreSQL
```

Có thể deploy frontend/backend lên cloud phù hợp với budget.

---

# 29. MVP Definition

MVP chỉ cần:

## Data

* CSV upload
* Dataset profiling
* Basic statistics

## AI

* Natural language query
* Structured analysis plan
* Validation

## Analytics

* Aggregation
* Filtering
* Grouping
* Trend
* Correlation
* Outlier

## Visualization

* Bar
* Line
* Scatter
* Histogram

## SVG

* Zoom
* Pan
* Hover
* Tooltip
* Selection

## Explainability

* Evidence
* Insight
* Claim validation

## Evaluation

* 100 benchmark questions
* At least 5 metrics

---

# 30. Advanced Features

Chỉ làm sau khi MVP ổn định.

## A. Automatic Chart Recommendation

```text
Dataset
 ↓
Data characteristics
 ↓
Chart recommendation
```

## B. Automatic EDA

User upload dataset:

```text
Dataset
 ↓
Profiler
 ↓
Interesting patterns
 ↓
Recommended visualizations
```

## C. Anomaly Explanation

Không chỉ:

```text
"Point X is anomalous."
```

mà:

```text
"Revenue is 3.1 standard deviations
above the rolling baseline."
```

## D. Multi-step Analysis Agent

```text
Question
 ↓
Hypothesis
 ↓
Analysis
 ↓
Evidence
 ↓
Follow-up analysis
```

## E. Natural Language Follow-up

```text
User:
Why is Q3 lower?

AI:
Region A contributed most to the decrease.

User:
Show me only Region A.

AI:
[updates SVG]
```

---

# 31. Security

Không cho LLM trực tiếp thực thi arbitrary Python.

Không dùng:

```python
eval(user_input)
```

hoặc:

```python
exec(llm_output)
```

Thay vào đó:

```text
LLM
 ↓
Structured JSON
 ↓
Schema validation
 ↓
Allowed operation validation
 ↓
Execution
```

---

# 32. Testing

## Unit Tests

Backend:

```text
aggregation
statistics
growth
correlation
outlier
```

Frontend:

```text
scale
axis
SVG rendering
interaction
```

## Integration Tests

```text
Question
 ↓
Plan
 ↓
Analysis
 ↓
Visualization
```

## LLM Tests

Test:

```text
invalid column
ambiguous question
missing date
unsupported operation
hallucinated column
```

---

# 33. Engineering Quality

Project phải có:

```text
Type hints
Linting
Formatting
Unit tests
Integration tests
Logging
Error handling
API documentation
Docker
CI/CD
```

Python:

```text
ruff
pytest
mypy
```

Frontend:

```text
ESLint
Prettier
Vitest
```

---

# 34. Git Strategy

Không commit kiểu:

```text
final
final2
final_final
final_really_final
```

Dùng:

```text
main
develop
feature/svg-engine
feature/data-engine
feature/llm-planner
feature/evidence
feature/evaluation
```

Commit:

```text
feat: add SVG bar chart renderer
feat: implement dataset profiler
feat: add structured analysis planner
feat: add evidence validation
test: add visualization benchmark
docs: add architecture specification
```

---

# 35. README Structure

README phải có:

```text
# Explainable AI Data Visualization Engine

## Demo

## Problem

## Solution

## Architecture

## Features

## Technology Stack

## Example

## Evaluation

## Results

## Installation

## Usage

## API

## Limitations

## Future Work
```

Quan trọng nhất:

### Architecture Diagram

### Demo GIF/video

### Evaluation Table

### Technical Decisions

---

# 36. Portfolio Demo

Demo nên đi theo scenario:

```text
1. Upload sales.csv
       ↓
2. System profiles dataset
       ↓
3. User asks:
   "Show revenue trend by region."
       ↓
4. AI creates analysis plan
       ↓
5. Backend validates/executions
       ↓
6. SVG chart appears
       ↓
7. User clicks Q3
       ↓
8. Evidence panel appears
       ↓
9. User asks:
   "Why did it decrease?"
       ↓
10. System performs deeper analysis
       ↓
11. SVG highlights contributing segments
       ↓
12. AI explains based on evidence
```

Đây nên là **main demo** khi phỏng vấn.

---

# 37. Resume Positioning

Không ghi:

> Built a dashboard using React and AI.

Nên hướng tới:

> **Built an explainable natural-language analytics system that converts user questions into validated analytical plans, executes deterministic statistical analysis, and renders evidence-linked interactive visualizations using a custom SVG engine.**

Có thể bổ sung:

> Implemented structured LLM outputs, evidence-based insight validation, interactive SVG rendering, and an evaluation benchmark measuring analytical accuracy, visualization accuracy, hallucination rate, and latency.

Khi có số liệu thực tế, thay bằng:

```text
92.4% intent accuracy
95.1% numerical accuracy
89.7% visualization accuracy
4.2% unsupported-claim rate
```

Không được tự tạo các con số này; phải lấy từ benchmark thực tế.

---

# 38. Skills Demonstrated

## Data Analyst

```text
EDA
SQL
KPI
Aggregation
Visualization
Business reasoning
```

## Data Scientist

```text
Statistics
Regression
Correlation
Anomaly Detection
Experimentation
Evaluation
```

## AI Engineer

```text
LLM
Structured Output
Tool Calling
Agent Planning
RAG/Evidence
Validation
Evaluation
API
```

## Software Engineer

```text
TypeScript
Python
React
FastAPI
PostgreSQL
Docker
Testing
CI/CD
```

---

# 39. Recommended Final Stack

## Frontend

```text
TypeScript
React
Vite
SVG
D3-scale
D3-shape
D3-array
CSS
```

## Backend

```text
Python
FastAPI
Pydantic
DuckDB
Polars
NumPy
Pandas
SciPy
scikit-learn
```

## AI

```text
LLM API
Structured Outputs
Tool Calling
Pydantic schemas
```

## Database

```text
PostgreSQL
```

## Infrastructure

```text
Docker
Docker Compose
GitHub Actions
```

## Testing

```text
pytest
Vitest
```

## Code Quality

```text
Ruff
Mypy
ESLint
Prettier
```

---

# 40. Suggested Timeline

```text
Week 1
├── Research
├── Architecture
└── SVG Engine foundation

Week 2
├── SVG charts
├── Scale
├── Axis
└── Interaction

Week 3
├── Data ingestion
├── Profiling
├── DuckDB
└── Analytics engine

Week 4
├── Visualization specification
├── Analysis planner
└── LLM integration

Week 5
├── Evidence engine
├── Insight generation
└── Claim validation

Week 6
├── Full UI
├── Chat
├── Dataset explorer
└── Interactive SVG

Week 7
├── Evaluation benchmark
├── Testing
└── Performance optimization

Week 8
├── Docker
├── Deployment
├── Documentation
├── Demo video
└── CV / portfolio
```

---

# 41. Priority Matrix

Nếu thời gian bị giới hạn:

| Component                 | Priority |
| ------------------------- | -------: |
| Deterministic Analytics   |    ⭐⭐⭐⭐⭐ |
| SVG Engine                |    ⭐⭐⭐⭐⭐ |
| Evidence / Explainability |    ⭐⭐⭐⭐⭐ |
| Evaluation                |    ⭐⭐⭐⭐⭐ |
| LLM Planner               |    ⭐⭐⭐⭐⭐ |
| Interactive UI            |     ⭐⭐⭐⭐ |
| Data Profiling            |     ⭐⭐⭐⭐ |
| Database                  |      ⭐⭐⭐ |
| Authentication            |        ⭐ |
| Fancy UI                  |        ⭐ |
| 20+ chart types           |        ⭐ |

---

# 42. Final Product Definition

Project cuối cùng nên được hiểu là:

```text
NOT:

"An AI dashboard."

BUT:

"An explainable analytical system that transforms
natural-language questions into validated analytical
workflows and evidence-linked interactive SVG
visualizations."
```

Core intellectual contribution:

```text
Natural Language
       ↓
Analytical Intent
       ↓
Structured Plan
       ↓
Deterministic Computation
       ↓
Evidence
       ↓
Visualization
       ↓
Explainable Insight
       ↓
Evaluation
```

---

# 43. Recommended Starting Point

Không bắt đầu bằng LLM.

Thứ tự nên là:

```text
STEP 1
Build SVG Engine
        ↓
STEP 2
Build Data Engine
        ↓
STEP 3
Define Visualization Schema
        ↓
STEP 4
Connect SVG + Data
        ↓
STEP 5
Add Analysis Planner
        ↓
STEP 6
Add LLM
        ↓
STEP 7
Add Evidence
        ↓
STEP 8
Add Evaluation
        ↓
STEP 9
Polish UI
        ↓
STEP 10
Deploy + Portfolio
```

**Đặc biệt: Phase 1–4 phải chạy được mà không cần LLM.**

Nếu LLM bị thay thế hoặc API bị lỗi, hệ thống visualization và analytics vẫn phải hoạt động. Đây là thiết kế tốt hơn về mặt engineering và cũng là điểm rất đáng nói khi phỏng vấn.

---

# 44. One-Sentence Project Pitch

> **An explainable AI analytics platform that converts natural-language analytical questions into validated statistical workflows and renders evidence-linked interactive visualizations through a custom SVG engine.**

Đây là câu mô tả nên dùng làm "kim chỉ nam" cho toàn bộ project.
