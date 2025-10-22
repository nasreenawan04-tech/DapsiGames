import { supabase } from "@/lib/supabase";
import type { StudyMaterial, InsertStudyMaterial, Bookmark, UserProgress } from "@shared/schema";

export interface StudyMaterialFilters {
  subject?: string;
  difficulty?: string;
  searchQuery?: string;
}

export const studyMaterialService = {
  async getAllMaterials(filters?: StudyMaterialFilters) {
    let query = supabase.from("study_materials").select("*");

    if (filters?.subject) {
      query = query.eq("subject", filters.subject);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query.order("title", { ascending: true });

    if (error) throw error;
    return data as StudyMaterial[];
  },

  async getMaterialById(id: string) {
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as StudyMaterial;
  },

  async getUserBookmarks(userId: string) {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        *,
        study_materials:study_material_id (*)
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

  async addBookmark(userId: string, studyMaterialId: string) {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ user_id: userId, study_material_id: studyMaterialId })
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  async removeBookmark(userId: string, studyMaterialId: string) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("study_material_id", studyMaterialId);

    if (error) throw error;
  },

  async isBookmarked(userId: string, studyMaterialId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("study_material_id", studyMaterialId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async trackProgress(userId: string, studyMaterialId: string, progressPercentage: number) {
    const completed = progressPercentage >= 100;
    
    const { data: existing, error: fetchError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("item_type", "study_material")
      .eq("item_id", studyMaterialId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { data, error } = await supabase
        .from("user_progress")
        .update({
          progress_percentage: progressPercentage,
          completed,
          last_accessed_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : existing.completed_at,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProgress;
    } else {
      const { data, error } = await supabase
        .from("user_progress")
        .insert({
          user_id: userId,
          item_type: "study_material",
          item_id: studyMaterialId,
          progress_percentage: progressPercentage,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserProgress;
    }
  },

  async getUserProgress(userId: string, studyMaterialId: string) {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("item_type", "study_material")
      .eq("item_id", studyMaterialId)
      .maybeSingle();

    if (error) throw error;
    return data as UserProgress | null;
  },

  async getRecommendations(userId: string, limit: number = 5) {
    const { data: userProgress, error: progressError } = await supabase
      .from("user_progress")
      .select("item_id, completed")
      .eq("user_id", userId)
      .eq("item_type", "study_material");

    if (progressError) throw progressError;

    const completedIds = userProgress?.filter(p => p.completed).map(p => p.item_id) || [];

    let query = supabase.from("study_materials").select("*").limit(limit);

    if (completedIds.length > 0) {
      query = query.not("id", "in", `(${completedIds.join(",")})`);
    }

    const { data, error } = await query.order("difficulty", { ascending: true });

    if (error) throw error;
    return data as StudyMaterial[];
  },

  async completeStudySession(userId: string, studyMaterialId: string, material: StudyMaterial) {
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsError) throw statsError;

    if (stats) {
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          total_points: stats.total_points + material.pointsReward,
          study_sessions: stats.study_sessions + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    }

    const { error: userError } = await supabase.rpc("add_user_points", {
      user_id: userId,
      points_to_add: material.pointsReward,
    });

    if (userError) throw userError;

    const { error: activityError } = await supabase
      .from("user_activities")
      .insert({
        user_id: userId,
        activity_type: "study_completed",
        activity_title: material.title,
        points_earned: material.pointsReward,
      });

    if (activityError) throw activityError;

    await this.trackProgress(userId, studyMaterialId, 100);

    return material.pointsReward;
  },

  async getSubjects() {
    const { data, error } = await supabase
      .from("study_materials")
      .select("subject")
      .order("subject", { ascending: true });

    if (error) throw error;

    const uniqueSubjects = Array.from(new Set(data.map(item => item.subject)));
    return uniqueSubjects;
  },
};
