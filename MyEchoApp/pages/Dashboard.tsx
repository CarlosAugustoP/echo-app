import { useEffect, useMemo, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { PageHeader } from "../components/common/PageHeader";
import { SkeletonBlock } from "../components/common/Skeleton";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { ContributionSummaryDto, ImpactByRegionDto } from "../types/api";

function parseSafeNumber(value: number | string | undefined | null) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatEthValue(value: number | string | undefined | null) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(parseSafeNumber(value));
}

function formatVariationPercentage(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? "0%";

  if (normalizedValue.startsWith("+") || normalizedValue.startsWith("-")) {
    return normalizedValue;
  }

  return `+${normalizedValue}`;
}

type SummaryCardProps = {
  summary: ContributionSummaryDto;
};

type RegionCardProps = {
  regions: ImpactByRegionDto[];
};

function ContributionSummaryCard({ summary }: SummaryCardProps) {
  const variationAmount = parseSafeNumber(summary.variationInCurrentMonth);
  const accentColor = variationAmount >= 0 ? "#12B886" : "#D16464";

  return (
    <View
      className="overflow-hidden rounded-[30px] border border-[#EEF2ED] bg-white px-6 py-6"
      style={{
        shadowColor: "#DDE6DE",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
        elevation: 3,
      }}
    >
      <View className="absolute bottom-[-18px] right-[-12px] opacity-20">
        <Ionicons name="leaf-outline" size={172} color="#DDEEDC" />
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-4">
          <View className="h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-[#EEF4EE]">
            <MaterialCommunityIcons name="cash-multiple" size={34} color="#206223" />
          </View>

          <Text className="text-[13px] font-semibold uppercase tracking-[1.8px] text-[#4A534E]">
            IMPACTO TOTAL ESSE MES
          </Text>
        </View>

        <View className="gap-4">
          <Text className="text-5xl font-semibold leading-[64px] tracking-[-2.4px] text-[#202124]">
            {`${formatEthValue(summary.totalContributed)} ETH`}
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: accentColor }} />
            <Text className="text-[14px] font-semibold leading-7" style={{ color: accentColor }}>
              {`${formatVariationPercentage(summary.variationInCurrentMonthPercentage)} este mes`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function DashboardSummarySkeleton() {
  return (
    <View className="rounded-[30px] border border-[#EEF2ED] bg-white px-6 py-6">
      <View className="gap-12">
        <View className="flex-row items-center gap-4">
          <SkeletonBlock width={64} height={64} borderRadius={20} />
          <SkeletonBlock width={220} height={22} borderRadius={999} />
        </View>

        <View className="gap-8">
          <SkeletonBlock width="74%" height={64} borderRadius={20} />
          <View className="flex-row items-center gap-3">
            <SkeletonBlock width={10} height={10} borderRadius={999} />
            <SkeletonBlock width={230} height={28} borderRadius={999} />
          </View>
        </View>
      </View>
    </View>
  );
}

function RegionImpactCard({ regions }: RegionCardProps) {
  const orderedRegions = useMemo(
    () => [...regions].sort((left, right) => parseSafeNumber(right.amount) - parseSafeNumber(left.amount)),
    [regions],
  );
  const maxAmount = orderedRegions.reduce((highestValue, region) => {
    const nextAmount = parseSafeNumber(region.amount);
    return nextAmount > highestValue ? nextAmount : highestValue;
  }, 0);

  return (
    <View className="rounded-[30px] border border-[#EEF2ED] bg-white px-6 py-6">
      <Text className="text-[24px] font-semibold leading-8 text-[#202124]">Impacto por Região</Text>

      <View className="mt-8 gap-8">
        {orderedRegions.map((region, index) => {
          const amount = parseSafeNumber(region.amount);
          const progress = maxAmount > 0 ? Math.max(0.08, amount / maxAmount) : 0;
          const barColor = index === 0 ? "#206F25" : index === 1 ? "#5D9C67" : "#8AAC8D";

          return (
            <View key={`${region.region}-${index}`} className="gap-3">
              <View className="flex-row items-end justify-between gap-4">
                <Text className="text-[16px] font-semibold leading-6 text-[#202124]">{region.region}</Text>
                <Text className="text-[16px] font-semibold leading-6 text-[#2C7A35]">{`${formatEthValue(amount)} ETH`}</Text>
              </View>

              <View className="h-[16px] overflow-hidden rounded-full bg-[#E5E8E4]">
                <View className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RegionImpactSkeleton() {
  return (
    <View className="rounded-[30px] border border-[#EEF2ED] bg-white px-6 py-6">
      <SkeletonBlock width={220} height={28} borderRadius={999} />

      <View className="mt-8 gap-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={`region-skeleton-${index}`} className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
              <SkeletonBlock width={120} height={18} borderRadius={999} />
              <SkeletonBlock width={90} height={18} borderRadius={999} />
            </View>
            <SkeletonBlock width="100%" height={16} borderRadius={999} />
          </View>
        ))}
      </View>
    </View>
  );
}

function CardErrorState({ title, message }: { title: string; message: string }) {
  return (
    <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
      <Text className="text-[15px] font-semibold text-[#A33A3A]">{title}</Text>
      <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{message}</Text>
    </View>
  );
}

function CardEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
      <Text className="text-[18px] font-semibold text-[#202124]">{title}</Text>
      <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">{message}</Text>
    </View>
  );
}

export default function DashboardPage({}: DashboardScreenProps) {
  const [summary, setSummary] = useState<ContributionSummaryDto | null>(null);
  const [impactByRegion, setImpactByRegion] = useState<ImpactByRegionDto[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingImpactByRegion, setIsLoadingImpactByRegion] = useState(true);
  const [summaryErrorMessage, setSummaryErrorMessage] = useState("");
  const [impactByRegionErrorMessage, setImpactByRegionErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoadingSummary(true);
      setIsLoadingImpactByRegion(true);
      setSummaryErrorMessage("");
      setImpactByRegionErrorMessage("");

      const [summaryResult, regionResult] = await Promise.allSettled([
        apiClient.getContributionSummary(),
        apiClient.getImpactByRegion(),
      ]);

      if (!isMounted) {
        return;
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        setSummary(null);
        setSummaryErrorMessage(
          summaryResult.reason instanceof Error ? summaryResult.reason.message : "Nao foi possivel carregar o resumo.",
        );
      }

      if (regionResult.status === "fulfilled") {
        setImpactByRegion(regionResult.value);
      } else {
        setImpactByRegion([]);
        setImpactByRegionErrorMessage(
          regionResult.reason instanceof Error
            ? regionResult.reason.message
            : "Nao foi possivel carregar o impacto por regiao.",
        );
      }

      setIsLoadingSummary(false);
      setIsLoadingImpactByRegion(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="dashboard">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <PageHeader
          eyebrow="Painel do doador"
          title="Dashboard"
          description="Acompanhe rapidamente a evolucao das suas contribuicoes e o impacto que elas estao gerando."
        />

        {isLoadingSummary ? <DashboardSummarySkeleton /> : null}

        {!isLoadingSummary && summaryErrorMessage ? (
          <CardErrorState title="Nao foi possivel carregar o resumo" message={summaryErrorMessage} />
        ) : null}

        {!isLoadingSummary && !summaryErrorMessage && summary ? <ContributionSummaryCard summary={summary} /> : null}

        {!isLoadingSummary && !summaryErrorMessage && !summary ? (
          <CardEmptyState
            title="Sem dados por enquanto"
            message="Assim que novas contribuicoes forem registradas, o resumo aparecera aqui."
          />
        ) : null}

        {isLoadingImpactByRegion ? <RegionImpactSkeleton /> : null}

        {!isLoadingImpactByRegion && impactByRegionErrorMessage ? (
          <CardErrorState title="Nao foi possivel carregar o impacto por regiao" message={impactByRegionErrorMessage} />
        ) : null}

        {!isLoadingImpactByRegion && !impactByRegionErrorMessage && impactByRegion.length > 0 ? (
          <RegionImpactCard regions={impactByRegion} />
        ) : null}

        {!isLoadingImpactByRegion && !impactByRegionErrorMessage && impactByRegion.length === 0 ? (
          <CardEmptyState
            title="Sem impacto regional por enquanto"
            message="Quando suas contribuicoes forem associadas a regioes, este painel mostrara a distribuicao."
          />
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
