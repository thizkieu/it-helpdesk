# Phân Tích Hệ Thống Quản Lý Yêu Cầu Hỗ Trợ IT (IT Helpdesk)

Tài liệu này bao gồm các sơ đồ phân tích hệ thống IT Helpdesk, tuân thủ nghiêm ngặt quy chuẩn Coding Convention ABP .NET + Angular.

## 1. Sơ đồ Use Case (Use Case Diagram)

```mermaid
flowchart LR
    User([End User])
    Agent([IT Agent])
    Lead([IT Team Lead])
    Manager([IT Manager])

    subgraph IT Helpdesk System
        UC1(Tạo Ticket)
        UC2(Xem & Bình luận Ticket của mình)
        UC3(Đánh giá CSAT)
        UC4(Tiếp nhận & Xử lý Ticket)
        UC5(Thay đổi Status Ticket)
        UC6(Phân công/Chuyển tuyến Ticket)
        UC7(Giám sát SLA)
        UC8(Quản lý Danh mục & SLA)
        UC9(Xem Dashboard & Báo cáo)
    end

    User --> UC1
    User --> UC2
    User --> UC3
    Agent --> UC4
    Agent --> UC5
    Agent --> UC2
    Lead --> UC6
    Lead --> UC7
    Lead --> UC4
    Manager --> UC8
    Manager --> UC9
    Manager --> UC7
```

## 2. Sơ đồ Nghiệp vụ (Business Flow Diagram)

```mermaid
stateDiagram-v2
    [*] --> New: End User tạo Ticket
    New --> Assigned: IT Lead phân công
    New --> Open: IT Agent tự nhận
    Assigned --> InProgress: Agent bắt đầu xử lý
    Open --> InProgress: Agent bắt đầu xử lý
    InProgress --> PendingUser: Cần User cung cấp thêm thông tin
    PendingUser --> InProgress: User đã phản hồi
    InProgress --> Escalated: Vượt khả năng / Quá hạn SLA
    Escalated --> InProgress: Cấp cao hơn xử lý xong / Chỉ đạo lại
    InProgress --> Resolved: Đã xử lý xong (Fix)
    Resolved --> Reopened: User báo chưa giải quyết được
    Reopened --> InProgress: Agent tiếp tục xử lý
    Resolved --> Closed: User xác nhận OK / Auto-close sau N ngày
    Closed --> [*]
```

## 3. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Angular (TicketComponent)
    participant API as ABP API Gateway
    participant App as TicketAppService
    participant Domain as TicketManager (Domain)
    participant Repo as ITicketRepository
    participant DB as SQL Server

    User->>UI: Điền form & Bấm "Gửi Yêu Cầu"
    UI->>API: POST /api/app/helpdesk/ticket (CreateTicketInput)
    API->>App: CreateAsync(CreateTicketInput input)
    App->>App: Validate DTO (Required, MaxLength)
    App->>Domain: CreateTicketAsync(input.Title, input.CategoryId...)
    Note over Domain: Xử lý Business Rule: Tính Priority, SLA, gen TicketNo
    Domain-->>App: Trả về HelpdeskTicket Entity
    App->>Repo: InsertAsync(ticket)
    Repo->>DB: Thực thi lệnh INSERT (EF Core UnitOfWork)
    DB-->>Repo: Trả về Success
    Repo-->>App: Trả về Entity (kèm ID)
    App->>App: ObjectMapper.Map<TicketDto>(ticket)
    App-->>API: Trả về TicketDto
    API-->>UI: Response 200 OK + Data
    UI-->>User: Hiển thị thông báo thành công & Mã Ticket
```

## 4. Sơ đồ Lớp (Class Diagram)

```mermaid
classDiagram
    class FullAuditedEntity~T~ {
        +T Id
        +DateTime CreationTime
        +Guid CreatorId
        +DateTime ModificationTime
        +bool IsDeleted
    }

    class HelpdeskTicket {
        +string TicketNo
        +string Title
        +string Description
        +long CategoryId
        +long PriorityId
        +TicketStatus Status
        +Guid? AssigneeId
        +long? TeamId
        +DateTime? DueDate
        +DateTime? ResolvedAt
    }

    class TicketAppService {
        -ITicketRepository _ticketRepository
        +CreateAsync(CreateTicketInput input) TicketDto
        +GetAsync(long id) TicketDto
        +AssignAsync(AssignTicketDto input) Task
    }

    class ITicketRepository {
        <<interface>>
        +GetListAsync(...) List~HelpdeskTicket~
        +GetQueryableAsync() IQueryable~HelpdeskTicket~
    }

    FullAuditedEntity <|-- HelpdeskTicket
    ITicketRepository ..> HelpdeskTicket : Quản lý
    TicketAppService --> ITicketRepository : Inject (DI)
```

## 5. Sơ đồ ERD (Database Diagram)

```mermaid
erDiagram
    HelpdeskTicket ||--o{ HelpdeskTicketComment : "có nhiều"
    HelpdeskCategory ||--o{ HelpdeskTicket : "chứa"
    HelpdeskPriority ||--o{ HelpdeskTicket : "định nghĩa SLA cho"
    HelpdeskTeam ||--o{ HelpdeskTicket : "xử lý"

    HelpdeskTicket {
        long Id PK
        string TicketNo "Index, Unique"
        long CategoryId FK
        long PriorityId FK
        long TeamId FK
        uniqueidentifier AssigneeId FK
        int Status
    }

    HelpdeskCategory {
        long Id PK
        string Code
        string Name
    }

    HelpdeskPriority {
        long Id PK
        string Name
        int Level
        int ResolutionMinutes
    }

    HelpdeskTeam {
        long Id PK
        string Name
        bool IsActive
    }
```