1. There are 2 different admin positions, subAdmin and Admin. Both can call api routes and visit some admin pages. Only admins can visit the main admin page. Check on the client with user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin

2. Reusable EmptyState component for empty sections
   - Import: `@/components/ui/empty-state`
   - Props: `primary: React.ReactNode` (required), `secondary?: React.ReactNode`, `className?: string`
   - Style: dashed border card matching election tab empty state
   - Usage examples:

     ```tsx
     import { EmptyState } from "@/components/ui/empty-state";

     <EmptyState
       primary="Education details are not available yet."
       secondary="Check back soon as the candidate adds details."
     />

     <EmptyState
       primary="Candidate overview is not available yet for this election."
       secondary="Check back soon as the candidate adds details."
     />
     ```
