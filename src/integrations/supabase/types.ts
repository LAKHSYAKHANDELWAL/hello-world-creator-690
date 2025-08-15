export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          name: string
          password: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          name: string
          password: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          name?: string
          password?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          message: string | null
          post_date: string | null
          target_class: string | null
          target_section: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          post_date?: string | null
          target_class?: string | null
          target_section?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          post_date?: string | null
          target_class?: string | null
          target_section?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exam_marks: {
        Row: {
          class_name: string
          created_at: string
          exam_name: string | null
          exam_type: string
          id: string
          marks_obtained: number
          out_of: number
          student_id: string | null
          student_name: string
          subject: string | null
        }
        Insert: {
          class_name: string
          created_at?: string
          exam_name?: string | null
          exam_type: string
          id?: string
          marks_obtained: number
          out_of: number
          student_id?: string | null
          student_name: string
          subject?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string
          exam_name?: string | null
          exam_type?: string
          id?: string
          marks_obtained?: number
          out_of?: number
          student_id?: string | null
          student_name?: string
          subject?: string | null
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount_paid: number
          amount_pending: number | null
          created_at: string
          discount_amount: number | null
          id: string
          installment_no: number | null
          payment_date: string | null
          payment_mode: string
          student_id: string | null
          submitted_by: string | null
          term: string | null
          term_no: number | null
          updated_at: string
        }
        Insert: {
          amount_paid: number
          amount_pending?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          installment_no?: number | null
          payment_date?: string | null
          payment_mode: string
          student_id?: string | null
          submitted_by?: string | null
          term?: string | null
          term_no?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          amount_pending?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          installment_no?: number | null
          payment_date?: string | null
          payment_mode?: string
          student_id?: string | null
          submitted_by?: string | null
          term?: string | null
          term_no?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_remarks: {
        Row: {
          created_at: string
          follow_up_date: string | null
          id: string
          is_completed: boolean | null
          remark_text: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_completed?: boolean | null
          remark_text: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_completed?: boolean | null
          remark_text?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_remarks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          class: string
          created_at: string
          description: string | null
          fee_type: string
          id: string
          installments: number | null
          term_no: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          class: string
          created_at?: string
          description?: string | null
          fee_type: string
          id?: string
          installments?: number | null
          term_no?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          class?: string
          created_at?: string
          description?: string | null
          fee_type?: string
          id?: string
          installments?: number | null
          term_no?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fee_terms: {
        Row: {
          amount: number
          class: string
          created_at: string
          due_date: string
          id: string
          term_no: number
          updated_at: string
        }
        Insert: {
          amount?: number
          class: string
          created_at?: string
          due_date: string
          id?: string
          term_no: number
          updated_at?: string
        }
        Update: {
          amount?: number
          class?: string
          created_at?: string
          due_date?: string
          id?: string
          term_no?: number
          updated_at?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount_due: number
          amount_paid: number | null
          created_at: string
          due_date: string | null
          id: string
          payment_date: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_fees_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          attachment_url: string | null
          class_name: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          class_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          class_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          approved_by: string | null
          created_at: string
          date: string
          id: string
          reason: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leaves_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          class: string
          created_at: string
          discount_amount: number | null
          dob: string | null
          email: string | null
          fee_paid: number | null
          fee_pending: number | null
          fee_status: string | null
          full_name: string | null
          id: string
          login_id: string
          mother_name: string | null
          name: string | null
          parent_name: string | null
          parent_relation: string | null
          password: string
          phone: string | null
          phone1: string | null
          phone2: string | null
          previous_fee_pending: number | null
          section: string | null
          sr_no: number | null
          term1_due_date: string | null
          term2_due_date: string | null
          term3_due_date: string | null
          updated_at: string
          transport_fee: number | null
        }
        Insert: {
          address?: string | null
          class: string
          created_at?: string
          discount_amount?: number | null
          dob?: string | null
          email?: string | null
          fee_paid?: number | null
          fee_pending?: number | null
          fee_status?: string | null
          full_name?: string | null
          id?: string
          login_id: string
          mother_name?: string | null
          name?: string | null
          parent_name?: string | null
          parent_relation?: string | null
          password: string
          phone?: string | null
          phone1?: string | null
          phone2?: string | null
          previous_fee_pending?: number | null
          section?: string | null
          sr_no?: number | null
          term1_due_date?: string | null
          term2_due_date?: string | null
          term3_due_date?: string | null
          updated_at?: string
          transport_fee?: number | null
        }
        Update: {
          address?: string | null
          class?: string
          created_at?: string
          discount_amount?: number | null
          dob?: string | null
          email?: string | null
          fee_paid?: number | null
          fee_pending?: number | null
          fee_status?: string | null
          full_name?: string | null
          id?: string
          login_id?: string
          mother_name?: string | null
          name?: string | null
          parent_name?: string | null
          parent_relation?: string | null
          password?: string
          phone?: string | null
          phone1?: string | null
          phone2?: string | null
          previous_fee_pending?: number | null
          section?: string | null
          sr_no?: number | null
          term1_due_date?: string | null
          term2_due_date?: string | null
          term3_due_date?: string | null
          updated_at?: string
          transport_fee?: number | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          address: string | null
          assigned_classes: string[] | null
          created_at: string
          email: string | null
          id: string
          login_id: string
          name: string
          password: string
          phone: string | null
          role: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_classes?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          login_id: string
          name: string
          password: string
          phone?: string | null
          role?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_classes?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          login_id?: string
          name?: string
          password?: string
          phone?: string | null
          role?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      timetables: {
        Row: {
          class: string
          created_at: string
          day: string
          end_time: string | null
          id: string
          period: number | null
          period_no: number | null
          section: string | null
          start_time: string | null
          subject: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class: string
          created_at?: string
          day: string
          end_time?: string | null
          id?: string
          period?: number | null
          period_no?: number | null
          section?: string | null
          start_time?: string | null
          subject: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class?: string
          created_at?: string
          day?: string
          end_time?: string | null
          id?: string
          period?: number | null
          period_no?: number | null
          section?: string | null
          start_time?: string | null
          subject?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
