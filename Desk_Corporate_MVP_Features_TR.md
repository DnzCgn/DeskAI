# Desk — Kurumsal MVP Özellik Kapsamı

## 1. Amaç

Bu doküman, **Ekim 2026 başına kadar sunulabilecek ilk kurumsal Desk MVP'sinin** minimum özellik kapsamını tanımlar.

Amaç, mevcut geniş kurumsal Desk vizyonunu tamamen uygulamak değil; şirketlere gösterilebilecek, gerçek bir kurumsal kullanım akışını baştan sona çalıştıran küçük ama ciddi bir ilk ürün çıkarmaktır.

Kurumsal MVP'nin ana akışı:

```text
Kuruluş oluştur
    ↓
Yönetici giriş yapar
    ↓
Çalışanları ekler
    ↓
Rol ve ekip atar
    ↓
Kurumsal Desk agent'ları oluşturur
    ↓
Kurumsal bilgi ekler
    ↓
Çalışan Desk'i kullanır
    ↓
AI görevleri / konuşmaları çalıştırır
    ↓
Kullanım ölçülür
    ↓
Yönetici aktiviteyi ve denetimi görür
```

---

# 2. MVP'nin Ana Ürün Konumu

**Desk Corporate MVP**, şirketlerin çalışanlarına tek merkezden yönetilen bir AI çalışma katmanı sağlamalıdır.

MVP şu dört problemi çözmelidir:

1. **Şirket AI kullanımını merkezi olarak yönetebilmelidir.**
2. **Çalışanlar şirket tarafından tanımlanan AI agent'larını kullanabilmelidir.**
3. **Şirket bilgileri kontrollü şekilde AI bağlamına dahil edilebilmelidir.**
4. **Yönetici kim, ne, hangi agent/model ve ne kadar kullandı görebilmelidir.**

---

# 3. MVP — P0 Zorunlu Özellikler

Aşağıdaki özellikler sunulabilir ilk kurumsal MVP'nin çekirdeğidir.

## 3.1 Organizasyon ve Tenant

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C01 | Organization | Şirket/kurum hesabı |
| C02 | Tenant Isolation | Organizasyon verilerinin birbirinden ayrılması |
| C03 | Organization Profile | Şirket adı, logo, temel ayarlar |
| C04 | Organization Admin | İlk yönetici hesabı |
| C05 | Organization Settings | Temel kurumsal ayarlar |

**MVP kararı:** İlk sürümde çok karmaşık şirket hiyerarşisi gerekmez. Tek organizasyon altında temel yönetim yeterlidir.

---

## 3.2 Kullanıcı ve Rol Yönetimi

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C06 | Organization Users | Çalışan/kullanıcı yönetimi |
| C07 | User Invitation | E-posta ile kullanıcı daveti |
| C08 | User Activation/Deactivation | Kullanıcı aç/kapat |
| C09 | RBAC | Rol tabanlı yetki |
| C10 | Admin Role | Kurumsal yönetici |
| C11 | Member Role | Normal çalışan |
| C12 | Permission Guard | Sunucu tarafı yetki kontrolü |

MVP'de başlangıç rol modeli:

```text
Organization
├── Admin
└── Member
```

Daha gelişmiş roller daha sonraki sürümlerde eklenebilir.

---

# 3.3 Ekip Yönetimi

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C13 | Teams | Organizasyon içi ekipler |
| C14 | Team Membership | Kullanıcı-ekip ilişkisi |
| C15 | Team Agent Access | Agent'ı belirli ekiplere açma |
| C16 | Team Visibility | Ekip kapsamına göre içerik görünürlüğü |

Örnek:

```text
Acme
├── Software
├── Sales
└── Support
```

İlk MVP'de departman hiyerarşisi gerekmez; doğrudan ekip yeterlidir.

---

# 3.4 Kurumsal Agent Sistemi

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C17 | Organization Agents | Şirkete ait ortak agent'lar |
| C18 | Team Agents | Ekip bazlı agent'lar |
| C19 | Agent Builder | Agent oluşturma |
| C20 | Agent Personality | Agent davranışı/personality |
| C21 | Agent System Prompt | Agent talimatları |
| C22 | Agent Model Assignment | Agent'a model atama |
| C23 | Agent Tool Permissions | Agent yeteneklerini belirleme |
| C24 | Agent Access Policy | Hangi kullanıcı/ekibin kullanabileceği |
| C25 | Immutable Desk Agent | Sistem Desk agent'ının korunması |

Örnek:

```text
Organization Agents

Sales Assistant
Support Assistant
Developer Assistant
HR Assistant
Research Assistant
```

---

# 3.5 AI Model ve Provider Yönetimi

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C26 | Model Registry | Merkezi model kataloğu |
| C27 | Provider Registry | AI sağlayıcıları |
| C28 | Model Capability | Model yetenek bilgisi |
| C29 | Model Assignment | Agent/model eşleştirme |
| C30 | Approved Models | Kurum tarafından onaylanan modeller |
| C31 | Provider Policy | İzin verilen sağlayıcılar |
| C32 | Model Usage Tracking | Model kullanımının ölçülmesi |

İlk kurumsal MVP'de gerçek NVIDIA Build entegrasyonu kullanılabilir; mimari provider-agnostic kalmalıdır.

---

# 3.6 Kurumsal AI Sohbeti

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C33 | Corporate Chat | Kurumsal AI sohbeti |
| C34 | Agent Selection | Kullanıcının yetkili agent seçimi |
| C35 | Conversation Persistence | Sohbetlerin kalıcı saklanması |
| C36 | Streaming Responses | Gerçek zamanlı yanıt |
| C37 | Cancellation | Çalışan AI isteğini iptal edebilme |
| C38 | Conversation History | Geçmiş konuşmalar |
| C39 | Usage Attribution | Kullanımı kullanıcı/agent/model ile ilişkilendirme |

Bu bölüm MVP'nin çalışan kullanıcı tarafındaki ana yüzüdür.

---

# 3.7 Kurumsal Bilgi Alanı

İlk sürümde tam enterprise knowledge graph yerine basit ama gerçek bir kurumsal bilgi katmanı yeterlidir.

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C40 | Shared Knowledge | Şirket ortak bilgileri |
| C41 | Team Knowledge | Ekip bazlı bilgi |
| C42 | Document Upload | PDF/DOCX/TXT gibi dosya yükleme |
| C43 | Document Indexing | Belgeleri AI erişimine hazırlama |
| C44 | Knowledge Search | Bilgi arama |
| C45 | Access-Controlled Retrieval | Yetkiye göre bilgi erişimi |

Örnek:

```text
Company Knowledge
├── HR Policies
├── Product Documentation
├── Sales Playbook
├── Support Procedures
└── Engineering Docs
```

**MVP hedefi:** Kullanıcı "şirketimizin izin politikası nedir?" dediğinde Desk'in şirket tarafından eklenen bilgiyi kullanarak yanıt verebilmesi.

---

# 3.8 Kurumsal Politika Temeli

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C46 | Organization Policy Engine | Temel kurumsal politika katmanı |
| C47 | Model Approval Policy | Onaysız model kullanımını engelleme |
| C48 | Provider Blocking | Sağlayıcı engelleme |
| C49 | Agent Access Policy | Agent erişim politikası |
| C50 | Data Access Policy | Bilgi erişim kuralları |
| C51 | Server-Side Enforcement | Politikaların istemcide değil sunucuda uygulanması |

MVP'de aşağıdaki temel kural yeterlidir:

```text
Organization Policy
        ↓
Team Policy
        ↓
User Permission
        ↓
Agent Permission
```

AI modelinin kendisi yetki kaynağı değildir.

---

# 3.9 Kullanım ve Maliyet Takibi

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C52 | Usage Ledger | Merkezi kullanım kaydı |
| C53 | User Usage | Kullanıcı bazlı kullanım |
| C54 | Agent Usage | Agent bazlı kullanım |
| C55 | Model Usage | Model bazlı kullanım |
| C56 | Provider Usage | Provider bazlı kullanım |
| C57 | Usage Dashboard | Yönetici kullanım ekranı |
| C58 | Basic Usage Limit | Temel kullanım sınırı |

İlk MVP'de tam faturalandırma sistemi şart değildir.

Ancak her AI işlemi şu bilgilerle ilişkilendirilebilmelidir:

```text
Organization
User
Team
Agent
Model
Provider
Operation
Usage
Timestamp
```

---

# 3.10 Kurumsal Audit

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C59 | Enterprise Audit | Kurumsal audit |
| C60 | User Activity | Kullanıcı hareketleri |
| C61 | Agent Activity | Agent çalışmaları |
| C62 | AI Request Trace | AI request lifecycle |
| C63 | Permission Events | Yetki kararları |
| C64 | Admin Activity | Yönetici işlemleri |
| C65 | Correlation/Trace ID | İşlemlerin uçtan uca izlenmesi |

Yönetici en azından şunları görebilmelidir:

```text
Kim?
Ne yaptı?
Hangi agent?
Hangi model?
Ne zaman?
Sonuç ne oldu?
Kullanım ne kadar?
```

Hassas içerik loglara ham şekilde yazılmamalıdır.

---

# 3.11 Temel Onay Mekanizması

Kurumsal AI kullanımında bazı işlemler kullanıcı onayı gerektirir.

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C66 | Approval Request | Onay talebi |
| C67 | Admin Approval | Yönetici onayı |
| C68 | User Approval | Kullanıcı onayı |
| C69 | Approval Status | Bekliyor/onaylandı/reddedildi |
| C70 | Approval Audit | Onay geçmişi |

MVP'de yalnızca yüksek riskli işlemlere odaklanılabilir.

---

# 3.12 Bildirimler

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C71 | Notification Center | Merkezi bildirim alanı |
| C72 | Approval Notifications | Onay bildirimi |
| C73 | Task Completion Notification | Görev tamamlandı bildirimi |
| C74 | Security Notification | Güvenlik bildirimi |

---

# 3.13 Desktop Corporate Client

Kurumsal MVP'nin kullanıcı tarafı yalnızca web panelinden oluşmamalıdır.

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C75 | Desk Desktop App | Electron masaüstü uygulaması |
| C76 | Corporate Login | Şirket hesabıyla giriş |
| C77 | Agent Switcher | Yetkili agent'lar arasında geçiş |
| C78 | Corporate Chat | Desktop üzerinden AI kullanım |
| C79 | Background Presence | Desk'in arka planda çalışabilmesi |
| C80 | System Tray | Arka plan tray kullanımı |
| C81 | Assistant Surface | Aynı Windows masaüstünde açılan kompakt Desk arayüzü |
| C82 | Secure IPC | Güvenli Electron IPC |

Desktop uygulaması kullanıcıyı başka bir Windows Virtual Desktop'a geçirmek zorunda değildir.

Desk, kullanıcının bulunduğu Windows masaüstünde çalışabilmelidir.

---

# 3.14 Yönetim Paneli

Kurumsal ürünün admin tarafı için basit bir web paneli yeterlidir.

| ID | Özellik | MVP Kapsamı |
|---|---|---|
| C83 | Admin Dashboard | Kurumsal ana ekran |
| C84 | User Management | Kullanıcı yönetimi |
| C85 | Team Management | Ekip yönetimi |
| C86 | Agent Management | Agent yönetimi |
| C87 | Knowledge Management | Belgeler/bilgi yönetimi |
| C88 | Model Policy | Model/provider kontrolü |
| C89 | Usage Dashboard | Kullanım |
| C90 | Audit Explorer | Audit görüntüleme |
| C91 | Organization Settings | Kurum ayarları |

---

# 4. MVP'de Kesinlikle Henüz Yapılmaması Gerekenler

Sunuma kadar kapsamı büyütmemek için aşağıdaki özellikler sonraki sürümlere bırakılmalıdır.

## Enterprise AI Infrastructure — Sonraki Aşama

- Desk AI Server
- GPU/CPU/VRAM yönetimi
- Private Model Registry
- Hugging Face model importu
- Model Runtime Management
- AI Server Pools
- Private AI routing
- Mixed infrastructure
- Private compute accounting

## İleri Kurumsal Yönetişim — Sonraki Aşama

- DLP'nin tam sürümü
- Gelişmiş data classification
- Field-level permissions
- Zero-trust entegrasyonlarının tamamı
- Gelişmiş enterprise device policy
- Gelişmiş compliance controls

## AI Workforce — Sonraki Aşama

- Human + AI Workforce
- AI Team Leader
- Workload Distribution
- Employee AI Profiles
- Autonomous corporate workforce
- Karmaşık approval chains

## Kurumsal Uygulama Platformu — Sonraki Aşama

- Enterprise App Builder
- Corporate CRM
- HR Applications
- Finance Applications
- Helpdesk Applications
- Corporate database builder

## Kurumsal Billing — Sonraki Aşama

- Self-service enterprise subscription
- Fatura üretimi
- Kurumsal ödeme
- Department budgets
- Team budgets
- Cost centers
- Advanced chargeback

---

# 5. Sunum İçin En Güçlü Demo Senaryosu

MVP'nin gerçek değerini tek bir senaryo üzerinden göstermesi yeterlidir.

### Senaryo: Şirket İçinde AI Çalışma Katmanı

```text
Admin
 ↓
Acme organizasyonu oluşturur
 ↓
Çalışanları davet eder
 ↓
Sales ekibi oluşturur
 ↓
Sales Assistant agent'ı oluşturur
 ↓
Satış dokümanlarını yükler
 ↓
Agent'ı Sales ekibine açar
 ↓
Çalışan Desk'e giriş yapar
 ↓
Sales Assistant seçer
 ↓
"Geçen ayki satış prosedürüne göre
müşteriye nasıl cevap vermeliyim?"
 ↓
Desk şirket bilgisini kullanır
 ↓
Yanıt verir
 ↓
Kullanım kaydedilir
 ↓
Admin dashboard'da görünür
 ↓
Audit kaydı oluşur
```

Bu akışın baştan sona gerçekten çalışması, onlarca ileri seviye özelliğin yarım uygulanmasından daha önemlidir.

---

# 6. Teknik MVP Mimarisi

```text
                     Desk Corporate
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     Electron Client                   Web Admin
          │                                 │
          └────────────────┬────────────────┘
                           │
                        API
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Organization         Agent             AI Layer
      Service           Service          Orchestrator
        │                  │                  │
        ├── Users          ├── Agents        ├── Model Registry
        ├── Teams          ├── Permissions   ├── NVIDIA Provider
        └── Roles          └── Policies      └── Usage Ledger
                           │
                  ┌────────┴────────┐
                  │                 │
              MongoDB           RavenDB
                  │                 │
          Current state       Audit / Events
```

---

# 7. MVP'de Zorunlu Güvenlik

Kurumsal MVP küçük olsa bile aşağıdakiler ertelenmemelidir:

- Tenant isolation
- Server-side authorization
- RBAC
- Capability checks
- Secure session handling
- Secret isolation
- Provider key server-side only
- Audit events
- Correlation IDs
- Permission-denied states
- No raw credentials in logs
- No client-side authorization decisions
- Data access checks before retrieval
- Agent tool permission checks
- Global emergency stop foundation

Kurumsal özelliklerin geri kalanından önce bu temel güvenlik katmanı tamamlanmalıdır.

---

# 8. MVP'nin Kabul Kriteri

Kurumsal MVP şu akışın gerçek ortamda çalışmasıyla kabul edilebilir:

```text
Organization creation
        ↓
Admin authentication
        ↓
User invitation
        ↓
Team creation
        ↓
Corporate agent creation
        ↓
Knowledge upload
        ↓
Knowledge indexing
        ↓
User login
        ↓
Agent selection
        ↓
Real NVIDIA AI request
        ↓
Real streamed response
        ↓
Persistent conversation
        ↓
Usage ledger
        ↓
Audit event
        ↓
Admin dashboard
```

Ek olarak:

- MongoDB gerçek ortamda çalışmalı.
- RavenDB gerçek audit/event backend'i olarak çalışmalı.
- NVIDIA Build gerçek inference path'inde çalışmalı.
- Electron Desktop App gerçek kurulumla açılmalı.
- Web admin paneli gerçek API'ye bağlanmalı.
- Yetkisiz kullanıcı kurumsal verilere erişememeli.
- Restart sonrası state korunmalı.
- Hata durumlarında fake success olmamalı.

---

# 9. Öncelik Sırası

Ekim başına kadar uygulanacak gerçek geliştirme sırası:

```text
P0
Organization + Auth
        ↓
Users + Roles
        ↓
Teams
        ↓
Corporate Agents
        ↓
AI Model/Provider
        ↓
Corporate Chat
        ↓
Knowledge
        ↓
Usage
        ↓
Audit
        ↓
Admin Panel
        ↓
Electron Corporate Client
        ↓
Security / Regression / Release
```

---

# 10. Minimum Sunulabilir Özellik Seti

Tek cümleyle MVP:

> **Şirket yöneticisinin çalışanlarını ve ekiplerini oluşturabildiği, şirketine özel AI agent'ları tanımlayabildiği, kurum bilgilerini yükleyebildiği, çalışanların Desk üzerinden bu agent'larla gerçek AI görüşmeleri yapabildiği ve yöneticinin kullanım ile audit kayıtlarını merkezi olarak görebildiği kurumsal AI platformu.**

## MVP Hedefi

Öncelik:

**Gerçek kullanım akışı > özellik sayısı**

İlk sunum için eksiksiz çalışan 10–15 güçlü özellik, 100 yarım kurumsal özellikten daha değerlidir.

---

## Kaynak Envanterle İlişki

Bu MVP kapsamı mevcut Desk kurumsal feature inventory'sindeki özellikle:

- Organization
- Users
- Teams
- Roles
- Shared/Team Agents
- Shared Knowledge
- Enterprise Policy
- Model Policy
- Enterprise Audit
- Enterprise Permissions
- Token/Usage
- Enterprise Apps/Automation için sonraki aşama temelleri
- Reliability/Recovery
- Configuration/Consent

gruplarından türetilmiştir. Kurumsal envanterde bu özellikler 317–477 aralığında tanımlanmıştır; burada yalnızca Ekim başına kadar sunulabilir çekirdek kapsam ayrıştırılmıştır.
