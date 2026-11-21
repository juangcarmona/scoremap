---
id: CON-LOCAL-FIRST
type: constraint
title: Explicit native local and private service authority
status: draft
applies-to: [BC-LIBRARY, BC-SKETCH, BC-RECOVERY]
---

## Constraint

Musical meaning MUST remain instrument-agnostic. Distinguish three contexts: existing anonymous browser libraries, existing authenticated private-service libraries, and the standalone native Android local library. References to anonymous replacement/origin storage mean the existing browser context; references to private accounts, principals, grants, sessions, online ownership and offline leases mean the existing authenticated service context. The native local library is neither a service cache nor an anonymous-browser replacement operation.

Anonymous browser libraries remain device-local until explicit claim. A private self-hosted service is the acknowledged authority for authenticated libraries and recovery across devices; device durability alone is not remote save. Private service local access and pending work MUST obey current resource permissions and the protected-session policy. No managed cloud database or public multi-tenant service is required.

The native Android installation owns its device-local durable library without login or a backend. Its acknowledged local revisions, history inspection, history restore, recoverable song/set deletion and separately confirmed purge require no account or online permission check. All local content mutations still enforce edit admission, expected revision, complete domain validity, stable command identity and atomic durability. Native library access does not import or confer any private-service authority.

Existing web/private-service behavior and authorization/session/retention obligations remain in their existing context. No native operation automatically claims, synchronizes, replaces or retires that service. Independent complete song/set file exchange is not cross-device service acknowledgement.

## Rationale

The selected native journey needs durable personal music without a service while preserving the separately authorized private-service evolution and anonymous browser recovery.

## Consequences

Current anonymous browser work remains recoverable. Authenticated service content cannot inherit unconditional native or anonymous offline access. Network protection never substitutes for resource authorization. Native local history is not subject to the service's eight-hour lease or fresh-online trash checks; conversely native import cannot unlock protected service work.
