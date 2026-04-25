import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/common/PageHeader";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { NgoInfoCard } from "../components/project-details/NgoInfoCard";
import { ProjectImageCarousel } from "../components/project-details/ProjectImageCarousel";
import {
  defaultProjectImage,
  formatRelativeTime,
  normalizeImageUrl,
} from "../components/project-details/projectDetailsUtils";
import { ProjectBlogPostScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { ProjectBlogPostDto, ProjectDto, UserDto } from "../types/api";

function formatPublishedDate(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ProjectBlogPostPage({ navigation, route }: ProjectBlogPostScreenProps) {
  const [blogPost, setBlogPost] = useState<ProjectBlogPostDto | null>(null);
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [manager, setManager] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBlogPost = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const blogPostResult = await apiClient.getBlogPost(route.params.blogPostId);
        const resolvedProjectId = route.params.projectId ?? blogPostResult.projectId;
        let projectResult: ProjectDto | null = null;
        let managerResult: UserDto | null = null;

        if (resolvedProjectId) {
          try {
            projectResult = await apiClient.getProjectById(resolvedProjectId);
          } catch {
            projectResult = null;
          }
        }

        if (projectResult?.managerId) {
          try {
            managerResult = await apiClient.getUserById(projectResult.managerId);
          } catch {
            managerResult = null;
          }
        }

        if (isMounted) {
          setBlogPost(blogPostResult);
          setProject(projectResult);
          setManager(managerResult);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "We couldn't load this post right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBlogPost();

    return () => {
      isMounted = false;
    };
  }, [route.params.blogPostId, route.params.projectId]);

  const title = blogPost?.title?.trim() || "Atualizacao do projeto";
  const projectTitle = project?.title?.trim() || route.params.projectTitle?.trim() || "Projeto";
  const headerImageUrl = normalizeImageUrl(blogPost?.headerImage);
  const projectDescription = project?.description?.trim() || "";
  const managerImageUrl = normalizeImageUrl(manager?.profilePicture?.url ?? null);
  const managerName = manager?.name?.trim() || project?.createdByName?.trim() || "ONG";
  const managerDescription =
    manager?.description?.trim() ||
    manager?.bio?.trim() ||
    projectDescription ||
    " ";
  const contentBlocks = useMemo(() => {
    const content = blogPost?.content?.trim() || "";

    return content
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [blogPost?.content]);
  const galleryImages = (blogPost?.imagesUrls ?? [])
    .map((imageUrl) => normalizeImageUrl(imageUrl))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <PageHeader
          title={title}
          eyebrow={projectTitle}
          description={
            blogPost?.createdAt ? `${formatPublishedDate(blogPost.createdAt)} | ${formatRelativeTime(blogPost.createdAt)}` : undefined
          }
          backLabel="Voltar"
          onBackPress={() => navigation.goBack()}
        />

        {isLoading && !blogPost ? (
          <View className="gap-4">
            <SkeletonBlock height={240} borderRadius={24} />
            <View className="rounded-[22px] border border-[#EEF1EB] bg-white px-5 py-6">
              <SkeletonBlock height={18} width="32%" borderRadius={999} />
              <View className="mt-4 gap-3">
                <SkeletonBlock height={15} width="100%" borderRadius={999} />
                <SkeletonBlock height={15} width="92%" borderRadius={999} />
                <SkeletonBlock height={15} width="78%" borderRadius={999} />
              </View>
            </View>
          </View>
        ) : headerImageUrl ? (
          <Image source={{ uri: headerImageUrl }} className="h-[240px] w-full rounded-[24px]" resizeMode="cover" />
        ) : (
          <View className="h-[240px] w-full items-center justify-center rounded-[24px] bg-[#EEF2EE]">
            <Image
              source={defaultProjectImage}
              className="h-[92px] w-[92px]"
              resizeMode="contain"
              style={{ opacity: 0.18 }}
            />
          </View>
        )}

        {isLoading && !blogPost ? null : isLoading ? <StateCard kind="loading" message="Carregando postagem..." /> : null}

        {loadError ? <StateCard kind="error" message={loadError} /> : null}

        {!isLoading && !loadError ? (
          <View className="rounded-[22px] border border-[#EEF1EB] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold leading-6 text-[#202124]">Atualizacao</Text>
            <View className="mt-4 gap-4">
              {contentBlocks.length > 0 ? (
                contentBlocks.map((block, index) => (
                  <Text key={`${index}-${block.slice(0, 16)}`} className="text-[15px] leading-7 text-[#525B57]">
                    {block}
                  </Text>
                ))
              ) : (
                <Text className="text-[15px] leading-7 text-[#525B57]">Esta postagem ainda nao tem conteudo.</Text>
              )}
            </View>
          </View>
        ) : null}

        {galleryImages.length > 0 ? (
          <View className="gap-3">
            <Text className="text-[22px] font-semibold leading-7 text-[#202124]">Galeria</Text>
            <ProjectImageCarousel images={galleryImages} />
          </View>
        ) : null}

        {!isLoading && !loadError && projectDescription ? (
          <Pressable
            className="overflow-hidden rounded-[18px] border border-[#EEF1EB] bg-white"
            onPress={() => {
              if (!project?.id) {
                return;
              }

              navigation.navigate("ProjectDetails", { projectId: project.id });
            }}
            disabled={!project?.id}
            style={({ pressed }) => (pressed && project?.id ? { opacity: 0.9 } : undefined)}
          >
            {normalizeImageUrl(project?.mainImage) ? (
              <Image
                source={{ uri: normalizeImageUrl(project?.mainImage) ?? undefined }}
                className="h-[150px] w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-[150px] w-full items-center justify-center bg-[#EEF2EE]">
                <Image
                  source={defaultProjectImage}
                  className="h-[72px] w-[72px]"
                  resizeMode="contain"
                  style={{ opacity: 0.18 }}
                />
              </View>
            )}

            <View className="px-4 py-5">
              <Text className="text-[20px] font-semibold leading-6 text-[#202124]">Sobre o projeto</Text>
              <Text className="mt-3 text-[22px] font-semibold leading-7 text-[#202124]">
                {project?.title?.trim() || projectTitle}
              </Text>
              <Text className="mt-2 text-[15px] leading-6 text-[#525B57]" numberOfLines={2} ellipsizeMode="tail">
                {projectDescription}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {!isLoading && !loadError ? (
          <NgoInfoCard name={managerName} description={managerDescription} imageUrl={managerImageUrl} />
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
