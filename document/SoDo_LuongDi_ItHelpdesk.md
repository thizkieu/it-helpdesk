# BÁO CÁO KIẾN TRÚC & LUỒNG DỮ LIỆU BỘ SOURCE ITHELPDESK

**Dự án:** Quản lý ItHelpdesk (mini-crm-abp-10)
**Nền tảng:** ABP Framework (C# .NET & Angular)

---

## 1. Sơ đồ Kiến trúc & Luồng Dữ liệu (Architecture & Data Flow)

Sơ đồ dưới đây mô phỏng luồng dữ liệu một chiều (Unidirectional Data Flow) tuân thủ theo nguyên lý Domain-Driven Design (DDD) của ABP Framework.

```mermaid
graph TD
    %% Định nghĩa màu sắc
    classDef frontend fill:#eef2ff,stroke:#4f46e5,stroke-width:2px;
    classDef backend fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef db fill:#fef2f2,stroke:#dc2626,stroke-width:2px;

    subgraph Frontend [1. Frontend Angular - Port 4200]
        UI[Angular Components <br/> HTML/SCSS/TS] --> Proxy[Tầng Proxy sinh tự động <br/> thư mục /src/app/proxy/]
    end

    subgraph Backend [2. Backend .NET ABP - Port 44304]
        Proxy -- Xác thực OpenIddict / JWT --> API[Tầng HttpApi.Host <br/> Cổng tiếp nhận & Controller]
        
        API --> Application[Tầng Application & Contracts <br/> AppServices & DTOs]
        
        Application -- Gọi Mapping & Logic --> Domain[Tầng Domain <br/> Lõi nghiệp vụ: Category, Service, Priority, Team]
        
        Domain --> EFCore[Tầng EntityFrameworkCore <br/> DbContext & Repositories]
    end

    subgraph Database [3. Cơ sở dữ liệu]
        EFCore -- Thực thi EF/LINQ --> DB[(SQL Server Database)]
    end

    %% Áp dụng style
    class UI,Proxy frontend;
    class API,Application,Domain,EFCore backend;
    class DB db;