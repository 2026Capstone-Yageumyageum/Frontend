/**
 * [ReportNotice.tsx]
 * 리포트 화면에서 "보여줄 데이터가 없다"는 상황을 사용자에게 알리는 카드.
 *
 * 왜 필요한가요?
 * - 예전에는 조회 실패·상세 누락을 mock 데이터로 덮어서, 사용자가 남의 피드백을
 *   자기 분석 결과로 오해할 수 있었습니다. 없는 데이터는 없다고 말하는 편이 낫습니다.
 * - 실패 사유(백엔드 ErrorCode의 message)와 재시도 버튼을 한 자리에서 다루기 위해
 *   전체 화면 상태와 카드 형태를 같은 컴포넌트로 씁니다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';

interface ReportNoticeProps {
  /** Ionicons 이름. 상황에 맞는 아이콘을 넘긴다. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  /** 보통 백엔드가 내려준 message를 그대로 넣는다. */
  description?: string;
  /** 재시도 등 행동을 줄 수 있을 때만 넘긴다. */
  actionLabel?: string;
  onAction?: () => void;
}

export default function ReportNotice({
  icon = 'alert-circle-outline',
  title,
  description,
  actionLabel,
  onAction,
}: ReportNoticeProps) {
  return (
    <View
      className="bg-white rounded-3xl mx-5 mt-5 px-5 py-8 mb-4 items-center"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Ionicons name={icon} size={36} color="#C4C9CF" />

      <AppText weight="bold" className="text-text-primary text-base mt-4 text-center">
        {title}
      </AppText>

      {description ? (
        <AppText className="text-text-secondary text-sm mt-1.5 text-center">{description}</AppText>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          className="mt-5 px-6 py-2.5 rounded-full bg-brand"
        >
          <AppText weight="bold" className="text-white text-sm">
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
