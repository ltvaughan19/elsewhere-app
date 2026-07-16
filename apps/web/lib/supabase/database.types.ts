export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      claim_categories: {
        Row: {
          created_at: string
          default_risk_level: Database["public"]["Enums"]["claim_risk_level"]
          id: string
          is_active: boolean
          name: string
          portal_section_slug: string
          requires_official_source: boolean
          requires_professional_review: boolean
          review_interval_days: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          id?: string
          is_active?: boolean
          name: string
          portal_section_slug: string
          requires_official_source?: boolean
          requires_professional_review?: boolean
          review_interval_days?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          id?: string
          is_active?: boolean
          name?: string
          portal_section_slug?: string
          requires_official_source?: boolean
          requires_professional_review?: boolean
          review_interval_days?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      claim_version_citations: {
        Row: {
          claim_version_id: string
          created_at: string
          created_by: string | null
          evidence_excerpt: string | null
          exact_locator: string | null
          id: string
          role: Database["public"]["Enums"]["citation_role"]
          sort_order: number
          source_document_id: string
          source_snapshot_id: string | null
          support_note: string | null
        }
        Insert: {
          claim_version_id: string
          created_at?: string
          created_by?: string | null
          evidence_excerpt?: string | null
          exact_locator?: string | null
          id?: string
          role?: Database["public"]["Enums"]["citation_role"]
          sort_order?: number
          source_document_id: string
          source_snapshot_id?: string | null
          support_note?: string | null
        }
        Update: {
          claim_version_id?: string
          created_at?: string
          created_by?: string | null
          evidence_excerpt?: string | null
          exact_locator?: string | null
          id?: string
          role?: Database["public"]["Enums"]["citation_role"]
          sort_order?: number
          source_document_id?: string
          source_snapshot_id?: string | null
          support_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_version_citations_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "claim_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_version_citations_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_version_id"]
          },
          {
            foreignKeyName: "claim_version_citations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_version_citations_source_snapshot_id_fkey"
            columns: ["source_snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_versions: {
        Row: {
          applicability: Json
          authored_by: string | null
          change_summary: string | null
          claim_id: string
          confidence_level: Database["public"]["Enums"]["claim_confidence_level"]
          created_at: string
          effective_from: string | null
          effective_until: string | null
          id: string
          locale: string
          precise_text: string
          public_summary: string
          review_due_at: string | null
          updated_at: string
          user_meaning: string | null
          version_number: number
          workflow_state: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Insert: {
          applicability?: Json
          authored_by?: string | null
          change_summary?: string | null
          claim_id: string
          confidence_level?: Database["public"]["Enums"]["claim_confidence_level"]
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          locale?: string
          precise_text: string
          public_summary: string
          review_due_at?: string | null
          updated_at?: string
          user_meaning?: string | null
          version_number: number
          workflow_state?: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Update: {
          applicability?: Json
          authored_by?: string | null
          change_summary?: string | null
          claim_id?: string
          confidence_level?: Database["public"]["Enums"]["claim_confidence_level"]
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          locale?: string
          precise_text?: string
          public_summary?: string
          review_due_at?: string | null
          updated_at?: string
          user_meaning?: string | null
          version_number?: number
          workflow_state?: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Relationships: [
          {
            foreignKeyName: "claim_versions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_versions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      claims: {
        Row: {
          category_id: string
          claim_slug: string
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          portal_section_id: string | null
          requires_professional_review: boolean
          risk_level: Database["public"]["Enums"]["claim_risk_level"]
          suppressed_at: string | null
          suppressed_reason: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          claim_slug: string
          country_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          portal_section_id?: string | null
          requires_professional_review?: boolean
          risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          suppressed_at?: string | null
          suppressed_reason?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          claim_slug?: string
          country_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          portal_section_id?: string | null
          requires_professional_review?: boolean
          risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          suppressed_at?: string | null
          suppressed_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "claim_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "claims_portal_section_id_fkey"
            columns: ["portal_section_id"]
            isOneToOne: false
            referencedRelation: "portal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      content_block_claims: {
        Row: {
          claim_version_id: string
          content_block_version_id: string
          created_at: string
          sort_order: number
        }
        Insert: {
          claim_version_id: string
          content_block_version_id: string
          created_at?: string
          sort_order?: number
        }
        Update: {
          claim_version_id?: string
          content_block_version_id?: string
          created_at?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_block_claims_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "claim_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_block_claims_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_version_id"]
          },
          {
            foreignKeyName: "content_block_claims_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "content_block_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_block_claims_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["content_block_version_id"]
          },
        ]
      }
      content_block_versions: {
        Row: {
          authored_by: string | null
          body: Json
          change_summary: string | null
          content_block_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          version_number: number
          workflow_state: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Insert: {
          authored_by?: string | null
          body: Json
          change_summary?: string | null
          content_block_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          version_number: number
          workflow_state?: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Update: {
          authored_by?: string | null
          body?: Json
          change_summary?: string | null
          content_block_id?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          version_number?: number
          workflow_state?: Database["public"]["Enums"]["editorial_workflow_state"]
        }
        Relationships: [
          {
            foreignKeyName: "content_block_versions_content_block_id_fkey"
            columns: ["content_block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_block_versions_content_block_id_fkey"
            columns: ["content_block_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["content_block_id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["content_block_kind"]
          portal_section_id: string
          risk_level: Database["public"]["Enums"]["claim_risk_level"]
          slug: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["content_block_kind"]
          portal_section_id: string
          risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          slug: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["content_block_kind"]
          portal_section_id?: string
          risk_level?: Database["public"]["Enums"]["claim_risk_level"]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "content_blocks_portal_section_id_fkey"
            columns: ["portal_section_id"]
            isOneToOne: false
            referencedRelation: "portal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          flag_emoji: string | null
          id: string
          iso_code: string
          name: string
          region: string | null
          slug: string
          summary: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["country_visibility"]
        }
        Insert: {
          created_at?: string
          flag_emoji?: string | null
          id?: string
          iso_code: string
          name: string
          region?: string | null
          slug: string
          summary?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["country_visibility"]
        }
        Update: {
          created_at?: string
          flag_emoji?: string | null
          id?: string
          iso_code?: string
          name?: string
          region?: string | null
          slug?: string
          summary?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["country_visibility"]
        }
        Relationships: []
      }
      country_portals: {
        Row: {
          audience_scope: Json
          country_id: string
          coverage_level: Database["public"]["Enums"]["portal_coverage_level"]
          created_at: string
          default_locale: string
          overview: string | null
          updated_at: string
        }
        Insert: {
          audience_scope?: Json
          country_id: string
          coverage_level?: Database["public"]["Enums"]["portal_coverage_level"]
          created_at?: string
          default_locale?: string
          overview?: string | null
          updated_at?: string
        }
        Update: {
          audience_scope?: Json
          country_id?: string
          coverage_level?: Database["public"]["Enums"]["portal_coverage_level"]
          created_at?: string
          default_locale?: string
          overview?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_portals_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: true
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "country_portals_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: true
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
        ]
      }
      country_releases: {
        Row: {
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          is_current: boolean
          published_at: string | null
          published_by: string | null
          release_notes: string | null
          release_number: number
          state: Database["public"]["Enums"]["country_release_state"]
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean
          published_at?: string | null
          published_by?: string | null
          release_notes?: string | null
          release_number: number
          state?: Database["public"]["Enums"]["country_release_state"]
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean
          published_at?: string | null
          published_by?: string | null
          release_notes?: string | null
          release_number?: number
          state?: Database["public"]["Enums"]["country_release_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_releases_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "country_releases_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
        ]
      }
      editorial_audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          request_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          request_id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          request_id?: string
        }
        Relationships: []
      }
      editorial_reviews: {
        Row: {
          checklist: Json
          claim_version_id: string | null
          content_block_version_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["editorial_review_decision"]
          id: string
          notes: string | null
          release_id: string | null
          review_kind: Database["public"]["Enums"]["editorial_review_kind"]
          reviewed_snapshot_id: string | null
          reviewer_id: string
          source_document_id: string | null
        }
        Insert: {
          checklist?: Json
          claim_version_id?: string | null
          content_block_version_id?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["editorial_review_decision"]
          id?: string
          notes?: string | null
          release_id?: string | null
          review_kind: Database["public"]["Enums"]["editorial_review_kind"]
          reviewed_snapshot_id?: string | null
          reviewer_id: string
          source_document_id?: string | null
        }
        Update: {
          checklist?: Json
          claim_version_id?: string | null
          content_block_version_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["editorial_review_decision"]
          id?: string
          notes?: string | null
          release_id?: string | null
          review_kind?: Database["public"]["Enums"]["editorial_review_kind"]
          reviewed_snapshot_id?: string | null
          reviewer_id?: string
          source_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_reviews_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "claim_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_reviews_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_version_id"]
          },
          {
            foreignKeyName: "editorial_reviews_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "content_block_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_reviews_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["content_block_version_id"]
          },
          {
            foreignKeyName: "editorial_reviews_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "country_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_reviews_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "editorial_reviews_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "editorial_reviews_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "editorial_reviews_reviewed_snapshot_id_fkey"
            columns: ["reviewed_snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_reviews_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          consent_at: string
          created_at: string
          email: string
          free_brief: boolean
          id: string
          source: string
          unsubscribed_at: string | null
        }
        Insert: {
          consent_at?: string
          created_at?: string
          email: string
          free_brief?: boolean
          id?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string
          free_brief?: boolean
          id?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      outdated_information_reports: {
        Row: {
          claim_id: string | null
          country_id: string | null
          created_at: string
          description: string
          id: string
          page_url: string
          release_id: string | null
          reporter_email: string | null
          reporter_user_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["outdated_report_status"]
          suggested_source_url: string | null
          updated_at: string
        }
        Insert: {
          claim_id?: string | null
          country_id?: string | null
          created_at?: string
          description: string
          id?: string
          page_url: string
          release_id?: string | null
          reporter_email?: string | null
          reporter_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["outdated_report_status"]
          suggested_source_url?: string | null
          updated_at?: string
        }
        Update: {
          claim_id?: string | null
          country_id?: string | null
          created_at?: string
          description?: string
          id?: string
          page_url?: string
          release_id?: string | null
          reporter_email?: string | null
          reporter_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["outdated_report_status"]
          suggested_source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outdated_information_reports_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outdated_information_reports_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "outdated_information_reports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outdated_information_reports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "outdated_information_reports_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "country_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outdated_information_reports_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "outdated_information_reports_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "outdated_information_reports_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["release_id"]
          },
        ]
      }
      portal_sections: {
        Row: {
          country_id: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          is_required: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_required?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_required?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_sections_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_sections_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          digest_opt_in: boolean
          email: string | null
          id: string
          plan_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          digest_opt_in?: boolean
          email?: string | null
          id: string
          plan_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          digest_opt_in?: boolean
          email?: string | null
          id?: string
          plan_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      release_block_versions: {
        Row: {
          content_block_id: string
          content_block_version_id: string
          created_at: string
          portal_section_id: string
          release_id: string
          sort_order: number
        }
        Insert: {
          content_block_id: string
          content_block_version_id: string
          created_at?: string
          portal_section_id: string
          release_id: string
          sort_order?: number
        }
        Update: {
          content_block_id?: string
          content_block_version_id?: string
          created_at?: string
          portal_section_id?: string
          release_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "release_block_versions_content_block_id_fkey"
            columns: ["content_block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_block_versions_content_block_id_fkey"
            columns: ["content_block_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["content_block_id"]
          },
          {
            foreignKeyName: "release_block_versions_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "content_block_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_block_versions_content_block_version_id_fkey"
            columns: ["content_block_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["content_block_version_id"]
          },
          {
            foreignKeyName: "release_block_versions_portal_section_id_fkey"
            columns: ["portal_section_id"]
            isOneToOne: false
            referencedRelation: "portal_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_block_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "country_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_block_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "release_block_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "release_block_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["release_id"]
          },
        ]
      }
      release_claim_versions: {
        Row: {
          claim_id: string
          claim_version_id: string
          created_at: string
          portal_section_id: string
          release_id: string
          sort_order: number
        }
        Insert: {
          claim_id: string
          claim_version_id: string
          created_at?: string
          portal_section_id: string
          release_id: string
          sort_order?: number
        }
        Update: {
          claim_id?: string
          claim_version_id?: string
          created_at?: string
          portal_section_id?: string
          release_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "release_claim_versions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_claim_versions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_id"]
          },
          {
            foreignKeyName: "release_claim_versions_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "claim_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_claim_versions_claim_version_id_fkey"
            columns: ["claim_version_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["claim_version_id"]
          },
          {
            foreignKeyName: "release_claim_versions_portal_section_id_fkey"
            columns: ["portal_section_id"]
            isOneToOne: false
            referencedRelation: "portal_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_claim_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "country_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_claim_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_blocks"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "release_claim_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_claims"
            referencedColumns: ["release_id"]
          },
          {
            foreignKeyName: "release_claim_versions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["release_id"]
          },
        ]
      }
      source_documents: {
        Row: {
          authority_level: Database["public"]["Enums"]["source_authority_level"]
          canonical_url: string
          country_id: string | null
          created_at: string
          created_by: string | null
          id: string
          jurisdiction: string | null
          last_checked_at: string | null
          last_verified_at: string | null
          publication_date: string | null
          publisher: string
          review_due_at: string | null
          source_language: string
          state: Database["public"]["Enums"]["source_document_state"]
          title: string
          translation_status: string
          updated_at: string
        }
        Insert: {
          authority_level: Database["public"]["Enums"]["source_authority_level"]
          canonical_url: string
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jurisdiction?: string | null
          last_checked_at?: string | null
          last_verified_at?: string | null
          publication_date?: string | null
          publisher: string
          review_due_at?: string | null
          source_language?: string
          state?: Database["public"]["Enums"]["source_document_state"]
          title: string
          translation_status?: string
          updated_at?: string
        }
        Update: {
          authority_level?: Database["public"]["Enums"]["source_authority_level"]
          canonical_url?: string
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jurisdiction?: string | null
          last_checked_at?: string | null
          last_verified_at?: string | null
          publication_date?: string | null
          publisher?: string
          review_due_at?: string | null
          source_language?: string
          state?: Database["public"]["Enums"]["source_document_state"]
          title?: string
          translation_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "published_country_portals"
            referencedColumns: ["country_id"]
          },
        ]
      }
      source_snapshots: {
        Row: {
          capture_method: string
          captured_at: string
          captured_by: string | null
          captured_title: string | null
          content_hash: string
          created_at: string
          etag: string | null
          http_status: number | null
          id: string
          last_modified_header: string | null
          source_document_id: string
          storage_path: string | null
        }
        Insert: {
          capture_method?: string
          captured_at?: string
          captured_by?: string | null
          captured_title?: string | null
          content_hash: string
          created_at?: string
          etag?: string | null
          http_status?: number | null
          id?: string
          last_modified_header?: string | null
          source_document_id: string
          storage_path?: string | null
        }
        Update: {
          capture_method?: string
          captured_at?: string
          captured_by?: string | null
          captured_title?: string | null
          content_hash?: string
          created_at?: string
          etag?: string | null
          http_status?: number | null
          id?: string
          last_modified_header?: string | null
          source_document_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_snapshots_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_memberships: {
        Row: {
          active: boolean
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          plan: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          plan: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          plan?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      published_country_blocks: {
        Row: {
          body: Json | null
          claim_version_ids: Json | null
          content_block_id: string | null
          content_block_slug: string | null
          content_block_version_id: string | null
          country_slug: string | null
          kind: Database["public"]["Enums"]["content_block_kind"] | null
          release_id: string | null
          release_number: number | null
          risk_level: Database["public"]["Enums"]["claim_risk_level"] | null
          section_slug: string | null
          section_title: string | null
          sort_order: number | null
          title: string | null
          version_number: number | null
        }
        Relationships: []
      }
      published_country_claims: {
        Row: {
          applicability: Json | null
          citations: Json | null
          claim_id: string | null
          claim_slug: string | null
          claim_version_id: string | null
          confidence_level:
            | Database["public"]["Enums"]["claim_confidence_level"]
            | null
          country_slug: string | null
          locale: string | null
          public_summary: string | null
          release_id: string | null
          release_number: number | null
          requires_professional_review: boolean | null
          review_due_at: string | null
          risk_level: Database["public"]["Enums"]["claim_risk_level"] | null
          section_slug: string | null
          section_title: string | null
          sort_order: number | null
          user_meaning: string | null
          version_number: number | null
        }
        Relationships: []
      }
      published_country_portals: {
        Row: {
          audience_scope: Json | null
          country_id: string | null
          country_name: string | null
          country_slug: string | null
          coverage_level:
            | Database["public"]["Enums"]["portal_coverage_level"]
            | null
          default_locale: string | null
          flag_emoji: string | null
          iso_code: string | null
          overview: string | null
          published_at: string | null
          region: string | null
          release_id: string | null
          release_number: number | null
          reviewed_at: string | null
          summary: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_claim_draft_atomic: {
        Args: {
          citation_evidence_excerpt: string | null
          citation_exact_locator: string
          citation_source_document_id: string
          citation_source_snapshot_id: string
          citation_support_note: string | null
          target_category_id: string
          target_claim_slug: string
          target_country_id: string
          target_portal_section_id: string
          target_requires_professional_review: boolean
          target_risk_level: Database["public"]["Enums"]["claim_risk_level"]
          version_applicability: Json
          version_confidence_level: Database["public"]["Enums"]["claim_confidence_level"]
          version_effective_from: string | null
          version_effective_until: string | null
          version_locale: string
          version_precise_text: string
          version_public_summary: string
          version_user_meaning: string | null
        }
        Returns: string
      }
      create_content_block_draft_atomic: {
        Args: {
          supporting_claim_version_id: string
          target_block_slug: string
          target_country_id: string
          target_kind: Database["public"]["Enums"]["content_block_kind"]
          target_portal_section_id: string
          target_risk_level: Database["public"]["Enums"]["claim_risk_level"]
          version_body: Json
          version_title: string | null
        }
        Returns: string
      }
      create_country_release_draft_atomic: {
        Args: { target_country_id: string; target_release_notes: string }
        Returns: string
      }
      emergency_suppress_claim: {
        Args: { suppression_reason: string; target_claim_id: string }
        Returns: undefined
      }
      publish_country_release: {
        Args: { target_release_id: string }
        Returns: {
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          is_current: boolean
          published_at: string | null
          published_by: string | null
          release_notes: string | null
          release_number: number
          state: Database["public"]["Enums"]["country_release_state"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "country_releases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_claim_version: {
        Args: {
          review_checklist?: Json
          review_decision: Database["public"]["Enums"]["editorial_review_decision"]
          review_notes?: string
          target_claim_version_id: string
        }
        Returns: string
      }
      review_content_block_version: {
        Args: {
          review_checklist?: Json
          review_decision: Database["public"]["Enums"]["editorial_review_decision"]
          review_notes?: string
          target_content_block_version_id: string
        }
        Returns: string
      }
      review_country_release: {
        Args: {
          review_checklist?: Json
          review_decision: Database["public"]["Enums"]["editorial_review_decision"]
          review_notes?: string
          target_release_id: string
        }
        Returns: string
      }
      review_source_document: {
        Args: {
          review_checklist?: Json
          review_decision: Database["public"]["Enums"]["editorial_review_decision"]
          review_notes?: string
          target_source_document_id: string
        }
        Returns: string
      }
    }
    Enums: {
      citation_role: "primary" | "supporting" | "context" | "conflicting"
      claim_confidence_level: "low" | "medium" | "high"
      claim_risk_level: "low" | "medium" | "high" | "critical"
      content_block_kind:
        | "rich_text"
        | "key_facts"
        | "claim_list"
        | "steps"
        | "watchouts"
        | "stay_path_matrix"
        | "city_grid"
        | "budget_embed"
        | "source_list"
        | "change_log"
        | "next_action"
      country_release_state:
        | "draft"
        | "ready"
        | "published"
        | "superseded"
        | "withdrawn"
      country_visibility: "draft" | "preview" | "published" | "retired"
      editorial_review_decision: "approved" | "changes_requested" | "rejected"
      editorial_review_kind:
        | "editorial"
        | "source_verification"
        | "professional"
        | "release_qa"
      editorial_workflow_state:
        | "draft"
        | "in_review"
        | "approved"
        | "changes_requested"
        | "deprecated"
        | "disputed"
      outdated_report_status:
        | "open"
        | "triaged"
        | "investigating"
        | "resolved"
        | "rejected"
      portal_coverage_level: "preview" | "core" | "deep"
      source_authority_level:
        | "official_government"
        | "embassy_consulate"
        | "immigration_authority"
        | "intergovernmental"
        | "licensed_professional"
        | "reputable_institution"
        | "editorial"
        | "community"
      source_document_state:
        | "draft"
        | "verified"
        | "superseded"
        | "unavailable"
        | "disputed"
      staff_role: "editor" | "reviewer" | "publisher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      citation_role: ["primary", "supporting", "context", "conflicting"],
      claim_confidence_level: ["low", "medium", "high"],
      claim_risk_level: ["low", "medium", "high", "critical"],
      content_block_kind: [
        "rich_text",
        "key_facts",
        "claim_list",
        "steps",
        "watchouts",
        "stay_path_matrix",
        "city_grid",
        "budget_embed",
        "source_list",
        "change_log",
        "next_action",
      ],
      country_release_state: [
        "draft",
        "ready",
        "published",
        "superseded",
        "withdrawn",
      ],
      country_visibility: ["draft", "preview", "published", "retired"],
      editorial_review_decision: ["approved", "changes_requested", "rejected"],
      editorial_review_kind: [
        "editorial",
        "source_verification",
        "professional",
        "release_qa",
      ],
      editorial_workflow_state: [
        "draft",
        "in_review",
        "approved",
        "changes_requested",
        "deprecated",
        "disputed",
      ],
      outdated_report_status: [
        "open",
        "triaged",
        "investigating",
        "resolved",
        "rejected",
      ],
      portal_coverage_level: ["preview", "core", "deep"],
      source_authority_level: [
        "official_government",
        "embassy_consulate",
        "immigration_authority",
        "intergovernmental",
        "licensed_professional",
        "reputable_institution",
        "editorial",
        "community",
      ],
      source_document_state: [
        "draft",
        "verified",
        "superseded",
        "unavailable",
        "disputed",
      ],
      staff_role: ["editor", "reviewer", "publisher", "admin"],
    },
  },
} as const
